import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../integrations/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BADGES, badgesMerites, bornesMois, classer, periodeMois, type ActiviteMensuelle } from './bareme.js';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Ajoute (ou retire) des points, sans descendre sous zéro, puis vérifie les badges. */
  async ajouterPoints(userId: string, points: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: Math.max(0, user.points + points) },
    });
    await this.verifierBadges(userId);
  }

  async verifierBadges(userId: string) {
    const [signalementsCrees, signalementsConfirmes, confirmationsDonnees] = await Promise.all([
      this.prisma.signalement.count({ where: { auteurId: userId } }),
      this.prisma.signalement.count({ where: { auteurId: userId, statut: 'CONFIRME' } }),
      this.prisma.confirmation.count({ where: { userId } }),
    ]);
    for (const code of badgesMerites({ signalementsCrees, signalementsConfirmes, confirmationsDonnees })) {
      await this.attribuer(userId, code, '');
    }
  }

  /** Classement d'un mois ("2026-11"), par défaut le mois en cours. */
  async classement(periode = periodeMois(new Date()), limite = 20) {
    const { debut, fin } = bornesMois(periode);
    const periodeFiltre = { gte: debut, lt: fin };

    const [crees, confirmes, rejetes, confirmations] = await Promise.all([
      this.prisma.signalement.groupBy({ by: ['auteurId'], where: { createdAt: periodeFiltre }, _count: true }),
      this.prisma.signalement.groupBy({
        by: ['auteurId'],
        where: { createdAt: periodeFiltre, statut: { in: ['CONFIRME', 'RESOLU'] } },
        _count: true,
      }),
      this.prisma.signalement.groupBy({
        by: ['auteurId'],
        where: { createdAt: periodeFiltre, statut: 'REJETE' },
        _count: true,
      }),
      this.prisma.confirmation.groupBy({ by: ['userId'], where: { createdAt: periodeFiltre }, _count: true }),
    ]);

    const activites = new Map<string, ActiviteMensuelle>();
    const get = (userId: string) => {
      if (!activites.has(userId)) {
        activites.set(userId, {
          userId,
          signalementsCrees: 0,
          signalementsConfirmes: 0,
          signalementsRejetes: 0,
          confirmationsDonnees: 0,
        });
      }
      return activites.get(userId)!;
    };
    crees.forEach((r) => (get(r.auteurId).signalementsCrees = r._count));
    confirmes.forEach((r) => (get(r.auteurId).signalementsConfirmes = r._count));
    rejetes.forEach((r) => (get(r.auteurId).signalementsRejetes = r._count));
    confirmations.forEach((r) => (get(r.userId).confirmationsDonnees = r._count));

    const classes = classer([...activites.values()]).slice(0, limite);
    const users = await this.prisma.user.findMany({
      where: { id: { in: classes.map((c) => c.userId) } },
      select: { id: true, nom: true, commune: true },
    });
    const parId = new Map(users.map((u) => [u.id, u]));

    return {
      periode,
      classement: classes.map((c, i) => ({
        rang: i + 1,
        userId: c.userId,
        nom: parId.get(c.userId)?.nom ?? 'Citoyen',
        commune: parId.get(c.userId)?.commune ?? null,
        score: c.score,
        signalementsConfirmes: c.signalementsConfirmes,
      })),
    };
  }

  /** Le 1er de chaque mois à 6 h : badge « Meilleur citoyen » au 1er du mois précédent. */
  @Cron('0 6 1 * *', { timeZone: 'Africa/Abidjan' })
  async elireMeilleurCitoyen(reference = new Date()) {
    const moisPrecedent = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    const periode = periodeMois(moisPrecedent);
    const { classement } = await this.classement(periode, 1);
    const gagnant = classement[0];
    if (!gagnant) return null;

    await this.attribuer(gagnant.userId, BADGES.MEILLEUR_CITOYEN, periode);
    await this.notifications.envoyerA(
      { id: gagnant.userId },
      {
        titre: '🏅 Meilleur citoyen du mois !',
        corps: `Bravo ${gagnant.nom}, vos signalements ont aidé votre quartier en ${periode}.`,
      },
    );
    this.logger.log(`Meilleur citoyen ${periode} : ${gagnant.nom} (${gagnant.score} pts)`);
    return gagnant;
  }

  private async attribuer(userId: string, code: string, periode: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) return;
    await this.prisma.badgeUtilisateur.upsert({
      where: { userId_badgeId_periode: { userId, badgeId: badge.id, periode } },
      create: { userId, badgeId: badge.id, periode },
      update: {},
    });
  }
}
