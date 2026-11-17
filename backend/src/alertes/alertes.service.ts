import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { boiteAutour, distanceMetres, type Point } from '../common/geo.js';
import type { Alerte, Prisma } from '../generated/prisma/client.js';
import { IaClient } from '../integrations/ia.client.js';
import { NotificationsService } from '../integrations/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Decision } from '../regles/regles.js';
import { CreerAlerteDto, FiltreAlertesDto } from './dto.js';

type DecisionPositive = Extract<Decision, { declencher: true }>;

@Injectable()
export class AlertesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ia: IaClient,
    private readonly notifications: NotificationsService,
  ) {}

  /** Alertes publiées et non expirées — les plus proches d'abord si une position est donnée. */
  async actives(filtre: FiltreAlertesDto) {
    const maintenant = new Date();
    const alertes = await this.prisma.alerte.findMany({
      where: {
        statut: 'PUBLIEE',
        AND: [
          { OR: [{ expireLe: null }, { expireLe: { gt: maintenant } }] },
          ...(filtre.commune ? [{ OR: [{ commune: filtre.commune }, { commune: null }] }] : []),
        ],
      },
      include: { zone: { select: { id: true, nom: true, commune: true, niveau: true } } },
      orderBy: { publieeLe: 'desc' },
      take: 100,
    });

    if (filtre.lat === undefined || filtre.lng === undefined) return alertes;
    const ici = { latitude: filtre.lat, longitude: filtre.lng };
    return alertes
      .map((a) => ({
        ...a,
        distanceKm:
          a.latitude !== null && a.longitude !== null
            ? Math.round(distanceMetres(ici, { latitude: a.latitude, longitude: a.longitude }) / 100) / 10
            : null,
      }))
      .sort((x, y) => (x.distanceKm ?? 9999) - (y.distanceKm ?? 9999));
  }

  brouillons() {
    return this.prisma.alerte.findMany({
      where: { statut: 'BROUILLON' },
      include: { zone: { select: { nom: true, commune: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async creer(dto: CreerAlerteDto, auteurId: string) {
    const { publier, expireLe, ...donnees } = dto;
    const alerte = await this.prisma.alerte.create({
      data: { ...donnees, expireLe: expireLe ? new Date(expireLe) : undefined, auteurId },
    });
    return publier ? this.publier(alerte.id) : alerte;
  }

  /** Alerte proposée par le moteur de règles : reste en brouillon, les autorités sont prévenues. */
  async creerAutomatique(decision: DecisionPositive, contexte: { commune?: string | null; zoneId?: string | null }) {
    const lieu = contexte.commune ? ` à ${contexte.commune}` : '';
    const alerte = await this.prisma.alerte.create({
      data: {
        titre: `Inondation probable${lieu}`,
        message:
          `${decision.nbSources} habitants signalent de l'eau dans un rayon de 500 m${lieu}. ` +
          'Vérification nécessaire avant diffusion.',
        niveau: decision.niveau,
        type: 'INONDATION',
        statut: 'BROUILLON',
        origine: 'AUTOMATIQUE',
        latitude: decision.position.latitude,
        longitude: decision.position.longitude,
        rayonKm: 1,
        commune: contexte.commune ?? undefined,
        zoneId: contexte.zoneId ?? undefined,
      },
    });

    await this.notifications.envoyerA(
      { role: { in: ['AUTORITE', 'ADMIN'] } },
      {
        titre: `À vérifier : ${alerte.titre}`,
        corps: alerte.message,
        donnees: { type: 'alerte_a_verifier', alerteId: alerte.id },
        urgent: decision.niveau === 'DANGER',
      },
    );
    return alerte;
  }

  async publier(id: string) {
    const alerte = await this.trouver(id);
    if (alerte.statut === 'ARCHIVEE') throw new BadRequestException('Alerte archivée');

    let texteVocal = alerte.texteVocal;
    if (!texteVocal) {
      const ia = await this.ia.texteVocal({
        titre: alerte.titre,
        message: alerte.message,
        niveau: alerte.niveau,
        commune: alerte.commune,
      });
      texteVocal = ia?.texte ?? `Alerte Floodge. ${alerte.titre}. ${alerte.message}`.slice(0, 300);
    }

    const publiee = await this.prisma.alerte.update({
      where: { id },
      data: { statut: 'PUBLIEE', publieeLe: new Date(), texteVocal },
    });

    const destinataires = await this.notifications.envoyerA(this.cible(publiee), {
      titre: `${publiee.niveau === 'DANGER' ? '🔴' : publiee.niveau === 'VIGILANCE' ? '🟠' : '🔵'} ${publiee.titre}`,
      corps: publiee.message,
      donnees: { type: 'alerte', alerteId: publiee.id, texteVocal, niveau: publiee.niveau },
      urgent: publiee.niveau !== 'INFO',
    });
    return { ...publiee, destinataires };
  }

  async archiver(id: string) {
    await this.trouver(id);
    return this.prisma.alerte.update({ where: { id }, data: { statut: 'ARCHIVEE' } });
  }

  async trouver(id: string) {
    const alerte = await this.prisma.alerte.findUnique({ where: { id }, include: { zone: true } });
    if (!alerte) throw new NotFoundException('Alerte introuvable');
    return alerte;
  }

  /** Alertes automatiques ou publiées récentes (pour éviter les doublons). */
  recentesPres(p: Point, depuis: Date) {
    const b = boiteAutour(p, 2000);
    return this.prisma.alerte.findMany({
      where: {
        createdAt: { gte: depuis },
        statut: { in: ['BROUILLON', 'PUBLIEE'] },
        latitude: { gte: b.latMin, lte: b.latMax },
        longitude: { gte: b.lonMin, lte: b.lonMax },
      },
      select: { latitude: true, longitude: true, createdAt: true },
    });
  }

  /** Qui reçoit la notification : rayon autour du point, sinon commune, sinon tout le monde. */
  private cible(a: Alerte): Prisma.UserWhereInput {
    const filtres: Prisma.UserWhereInput[] = [];
    if (a.latitude !== null && a.longitude !== null && a.rayonKm) {
      // rectangle englobant : approximation suffisante pour cibler les notifications
      const b = boiteAutour({ latitude: a.latitude, longitude: a.longitude }, a.rayonKm * 1000);
      filtres.push({
        latitude: { gte: b.latMin, lte: b.latMax },
        longitude: { gte: b.lonMin, lte: b.lonMax },
      });
    }
    if (a.commune) filtres.push({ commune: a.commune });
    return filtres.length ? { OR: filtres } : {};
  }
}
