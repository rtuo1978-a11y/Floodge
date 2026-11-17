import { centre, distanceMetres, type Point } from '../common/geo.js';

/**
 * Moteur de règles — niveau 1 de "l'intelligence" de FlowManage.
 * Fonctions pures, testées dans regles.spec.ts. Les seuils se règlent ici.
 */
export const SEUILS = {
  RAYON_M: 500, // signalements considérés comme "au même endroit"
  FENETRE_H: 2, // sur les 2 dernières heures
  NB_SOURCES_MIN: 3, // au moins 3 personnes différentes (auteurs + confirmations)
  NB_ELEVES_DANGER: 2, // à partir de 2 signalements "ELEVE" → niveau DANGER proposé
  ANTI_DOUBLON_RAYON_M: 1000, // pas de nouvelle alerte auto si une existe déjà à moins de 1 km
  ANTI_DOUBLON_H: 6,
} as const;

export interface SignalementRegle extends Point {
  id: string;
  auteurId: string;
  niveau: 'FAIBLE' | 'MODERE' | 'ELEVE';
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'REJETE' | 'RESOLU';
  createdAt: Date;
  confirmateurs: string[]; // ids des utilisateurs ayant confirmé
}

export interface AlerteExistante extends Point {
  createdAt: Date;
}

export type Decision =
  | { declencher: false; raison: string }
  | {
      declencher: true;
      niveau: 'VIGILANCE' | 'DANGER';
      position: Point;
      signalementIds: string[];
      nbSources: number;
    };

export function evaluer(
  nouveau: SignalementRegle,
  recents: SignalementRegle[],
  alertesExistantes: AlerteExistante[],
  maintenant = new Date(),
): Decision {
  const limite = maintenant.getTime() - SEUILS.FENETRE_H * 3_600_000;

  const proches = [nouveau, ...recents.filter((s) => s.id !== nouveau.id)].filter(
    (s) =>
      s.statut !== 'REJETE' &&
      s.niveau !== 'FAIBLE' &&
      s.createdAt.getTime() >= limite &&
      distanceMetres(nouveau, s) <= SEUILS.RAYON_M,
  );

  const sources = new Set<string>();
  for (const s of proches) {
    sources.add(s.auteurId);
    s.confirmateurs.forEach((c) => sources.add(c));
  }

  if (sources.size < SEUILS.NB_SOURCES_MIN) {
    return { declencher: false, raison: `${sources.size} source(s) concordante(s) sur ${SEUILS.NB_SOURCES_MIN}` };
  }

  const position = centre(proches);
  const limiteDoublon = maintenant.getTime() - SEUILS.ANTI_DOUBLON_H * 3_600_000;
  const doublon = alertesExistantes.some(
    (a) => a.createdAt.getTime() >= limiteDoublon && distanceMetres(a, position) <= SEUILS.ANTI_DOUBLON_RAYON_M,
  );
  if (doublon) return { declencher: false, raison: 'Une alerte existe déjà pour ce secteur' };

  const nbEleves = proches.filter((s) => s.niveau === 'ELEVE').length;
  return {
    declencher: true,
    niveau: nbEleves >= SEUILS.NB_ELEVES_DANGER ? 'DANGER' : 'VIGILANCE',
    position,
    signalementIds: proches.map((s) => s.id),
    nbSources: sources.size,
  };
}
