/** Barème des points citoyens — modifiable en équipe. */
export const POINTS = {
  SIGNALEMENT_CREE: 5,
  SIGNALEMENT_CONFIRME_PAR_AUTORITE: 20,
  SIGNALEMENT_REJETE: -10,
  CONFIRMATION_DONNEE: 2,
} as const;

export const BADGES = {
  SENTINELLE: 'SENTINELLE', // premier signalement
  VIGIE_QUARTIER: 'VIGIE_QUARTIER', // 5 signalements confirmés par une autorité
  SOLIDAIRE: 'SOLIDAIRE', // 10 confirmations données
  MEILLEUR_CITOYEN: 'MEILLEUR_CITOYEN', // 1er du classement du mois
} as const;

export interface ActiviteMensuelle {
  userId: string;
  signalementsCrees: number;
  signalementsConfirmes: number;
  signalementsRejetes: number;
  confirmationsDonnees: number;
}

/** Score d'un citoyen sur une période (classement « Meilleur citoyen »). */
export function scoreMensuel(a: ActiviteMensuelle): number {
  const score =
    a.signalementsCrees * POINTS.SIGNALEMENT_CREE +
    a.signalementsConfirmes * POINTS.SIGNALEMENT_CONFIRME_PAR_AUTORITE +
    a.signalementsRejetes * POINTS.SIGNALEMENT_REJETE +
    a.confirmationsDonnees * POINTS.CONFIRMATION_DONNEE;
  return Math.max(0, score);
}

/**
 * Classe les citoyens par score décroissant.
 * Égalité : celui qui a le plus de signalements confirmés passe devant.
 */
export function classer(activites: ActiviteMensuelle[]) {
  return activites
    .map((a) => ({ ...a, score: scoreMensuel(a) }))
    .filter((a) => a.score > 0)
    .sort((x, y) => y.score - x.score || y.signalementsConfirmes - x.signalementsConfirmes);
}

/** Badges débloqués par les compteurs cumulés d'un utilisateur. */
export function badgesMerites(totaux: {
  signalementsCrees: number;
  signalementsConfirmes: number;
  confirmationsDonnees: number;
}): string[] {
  const badges: string[] = [];
  if (totaux.signalementsCrees >= 1) badges.push(BADGES.SENTINELLE);
  if (totaux.signalementsConfirmes >= 5) badges.push(BADGES.VIGIE_QUARTIER);
  if (totaux.confirmationsDonnees >= 10) badges.push(BADGES.SOLIDAIRE);
  return badges;
}

/** "2026-11" pour une date donnée. */
export function periodeMois(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function bornesMois(periode: string): { debut: Date; fin: Date } {
  const [annee, mois] = periode.split('-').map(Number);
  return { debut: new Date(annee, mois - 1, 1), fin: new Date(annee, mois, 1) };
}
