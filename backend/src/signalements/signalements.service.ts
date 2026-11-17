import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertesService } from '../alertes/alertes.service.js';
import { POINTS } from '../badges/bareme.js';
import { BadgesService } from '../badges/badges.service.js';
import { boiteAutour, distanceMetres, pointDansGeometrie, type Point } from '../common/geo.js';
import type { Prisma } from '../generated/prisma/client.js';
import { CarteClient } from '../integrations/carte.client.js';
import { IaClient } from '../integrations/ia.client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { evaluer, SEUILS, type SignalementRegle } from '../regles/regles.js';
import { ChangerStatutDto, CreerSignalementDto, FiltreSignalementsDto } from './dto.js';

const AVEC_AUTEUR = {
  auteur: { select: { id: true, nom: true } },
  _count: { select: { confirmations: true } },
} satisfies Prisma.SignalementInclude;

@Injectable()
export class SignalementsService {
  private readonly logger = new Logger(SignalementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly carte: CarteClient,
    private readonly ia: IaClient,
    private readonly alertes: AlertesService,
    private readonly badges: BadgesService,
  ) {}

  async creer(dto: CreerSignalementDto, auteurId: string) {
    // 1. Où est-ce ? (commune + zone à risque)
    const { zoneId, commune } = await this.localiser(dto);

    const signalement = await this.prisma.signalement.create({
      data: { ...dto, commune: dto.commune ?? commune, zoneId, auteurId },
      include: AVEC_AUTEUR,
    });

    // 2. Points citoyens + mise à jour de la dernière position (ciblage des alertes)
    await this.prisma.user.update({
      where: { id: auteurId },
      data: { latitude: dto.latitude, longitude: dto.longitude },
    });
    await this.badges.ajouterPoints(auteurId, POINTS.SIGNALEMENT_CREE);

    // 3. Analyse IA en arrière-plan (ne bloque pas la réponse)
    void this.analyser(signalement.id, dto, signalement.commune);

    // 4. Moteur de règles : faut-il proposer une alerte ?
    await this.appliquerRegles(signalement.id);

    return signalement;
  }

  async lister(f: FiltreSignalementsDto) {
    const depuis = new Date(Date.now() - (f.heures ?? 48) * 3_600_000);
    const where: Prisma.SignalementWhereInput = {
      createdAt: { gte: depuis },
      statut: f.statut ?? { not: 'REJETE' },
      commune: f.commune,
    };
    const ici = f.lat !== undefined && f.lng !== undefined ? { latitude: f.lat, longitude: f.lng } : null;
    if (ici && f.rayonKm) {
      const b = boiteAutour(ici, f.rayonKm * 1000);
      where.latitude = { gte: b.latMin, lte: b.latMax };
      where.longitude = { gte: b.lonMin, lte: b.lonMax };
    }
    const resultats = await this.prisma.signalement.findMany({
      where,
      include: AVEC_AUTEUR,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return ici && f.rayonKm
      ? resultats.filter((s) => distanceMetres(ici, s) <= f.rayonKm! * 1000)
      : resultats;
  }

  mesSignalements(userId: string) {
    return this.prisma.signalement.findMany({
      where: { auteurId: userId },
      include: AVEC_AUTEUR,
      orderBy: { createdAt: 'desc' },
    });
  }

  async trouver(id: string) {
    const s = await this.prisma.signalement.findUnique({
      where: { id },
      include: { ...AVEC_AUTEUR, zone: { select: { nom: true, niveau: true } } },
    });
    if (!s) throw new NotFoundException('Signalement introuvable');
    return s;
  }

  /** « Je vois aussi l'eau ici » : un autre citoyen confirme. */
  async confirmer(id: string, userId: string) {
    const s = await this.trouver(id);
    if (s.auteurId === userId) throw new ForbiddenException('Vous ne pouvez pas confirmer votre propre signalement');
    if (s.statut === 'REJETE' || s.statut === 'RESOLU') {
      throw new BadRequestException('Ce signalement est clos');
    }
    const deja = await this.prisma.confirmation.findUnique({
      where: { signalementId_userId: { signalementId: id, userId } },
    });
    if (!deja) {
      await this.prisma.confirmation.create({ data: { signalementId: id, userId } });
      await this.badges.ajouterPoints(userId, POINTS.CONFIRMATION_DONNEE);
      await this.appliquerRegles(id);
    }
    return this.trouver(id);
  }

  /** Vérification par une autorité. */
  async changerStatut(id: string, dto: ChangerStatutDto, verificateurId: string) {
    const avant = await this.trouver(id);
    const s = await this.prisma.signalement.update({
      where: { id },
      data: { statut: dto.statut, verificateurId, verifieLe: new Date() },
      include: AVEC_AUTEUR,
    });
    if (avant.statut === 'EN_ATTENTE') {
      if (dto.statut === 'CONFIRME') await this.badges.ajouterPoints(s.auteurId, POINTS.SIGNALEMENT_CONFIRME_PAR_AUTORITE);
      if (dto.statut === 'REJETE') await this.badges.ajouterPoints(s.auteurId, POINTS.SIGNALEMENT_REJETE);
    }
    return s;
  }

  /** Points inondés actifs (pour les itinéraires sûrs et le calcul de risque). */
  async pointsInondes(heures = 12) {
    return this.prisma.signalement.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - heures * 3_600_000) },
        statut: { in: ['EN_ATTENTE', 'CONFIRME'] },
        niveau: { in: ['MODERE', 'ELEVE'] },
      },
      select: { id: true, latitude: true, longitude: true, niveau: true, statut: true, commune: true, createdAt: true },
    });
  }

  /** Service cartographie si disponible, sinon recherche dans les zones de la base. */
  private async localiser(p: Point): Promise<{ zoneId: string | null; commune: string | null }> {
    const loc = await this.carte.localiser(p);
    if (loc) {
      const zone = loc.zone
        ? await this.prisma.zoneRisque.findUnique({ where: { code: loc.zone.code }, select: { id: true } })
        : null;
      return { zoneId: zone?.id ?? null, commune: loc.commune ?? loc.zone?.commune ?? null };
    }
    const zones = await this.prisma.zoneRisque.findMany({ select: { id: true, commune: true, geometrie: true } });
    const zone = zones.find((z) => pointDansGeometrie(p, z.geometrie));
    return { zoneId: zone?.id ?? null, commune: zone?.commune ?? null };
  }

  private async appliquerRegles(id: string) {
    try {
      const nouveau = await this.prisma.signalement.findUniqueOrThrow({
        where: { id },
        include: { confirmations: { select: { userId: true } } },
      });
      const depuis = new Date(Date.now() - SEUILS.FENETRE_H * 3_600_000);
      const b = boiteAutour(nouveau, SEUILS.RAYON_M);
      const recents = await this.prisma.signalement.findMany({
        where: {
          createdAt: { gte: depuis },
          latitude: { gte: b.latMin, lte: b.latMax },
          longitude: { gte: b.lonMin, lte: b.lonMax },
        },
        include: { confirmations: { select: { userId: true } } },
      });
      const versRegle = (s: typeof nouveau): SignalementRegle => ({
        ...s,
        confirmateurs: s.confirmations.map((c) => c.userId),
      });
      const existantes = await this.alertes.recentesPres(
        nouveau,
        new Date(Date.now() - SEUILS.ANTI_DOUBLON_H * 3_600_000),
      );
      const decision = evaluer(
        versRegle(nouveau),
        recents.map(versRegle),
        existantes.flatMap((a) =>
          a.latitude !== null && a.longitude !== null
            ? [{ latitude: a.latitude, longitude: a.longitude, createdAt: a.createdAt }]
            : [],
        ),
      );
      if (decision.declencher) {
        const concernes = recents.filter((s) => decision.signalementIds.includes(s.id));
        const alerte = await this.alertes.creerAutomatique(decision, {
          commune: nouveau.commune ?? concernes.find((s) => s.commune)?.commune,
          zoneId: nouveau.zoneId ?? concernes.find((s) => s.zoneId)?.zoneId,
        });
        this.logger.log(`Alerte automatique proposée (${alerte.niveau}) : ${alerte.id}`);
      }
    } catch (e) {
      this.logger.error(`Moteur de règles : ${(e as Error).message}`);
    }
  }

  private async analyser(id: string, dto: CreerSignalementDto, commune: string | null) {
    const analyse = await this.ia.analyserSignalement({ description: dto.description, niveau: dto.niveau, commune });
    if (analyse) {
      await this.prisma.signalement.update({ where: { id }, data: { analyseIa: { ...analyse } } }).catch(() => null);
    }
  }
}
