import type { NiveauRisque } from '../types.js';

/**
 * Score de risque d'inondation d'une zone (0 → 100) — niveau 2 de « l'intelligence » de FlowManage.
 *
 * Par temps sec, le score vaut le risque de base de la zone (relief, bas-fonds, historique).
 * Il monte vers 100 avec :
 *   - la pluie (observée SODEXAM sur 24 h + prévue sur 24 h), d'autant plus que la zone est vulnérable ;
 *   - les signalements citoyens récents dans la zone (qui comptent quelle que soit la vulnérabilité).
 *
 *   score = base + (100 − base) × [ 0,6 × pluie × vulnérabilité + 0,4 × signalements ]
 *
 * Les poids et seuils sont des hypothèses de départ, à ajuster avec les données réelles.
 */
export const PARAMETRES = {
  poidsPluie: 0.6,
  poidsSignalements: 0.4,
  partPluieObservee: 0.65, // le reste : pluie prévue
  saturationPluieObservee24hMm: 100,
  saturationPluiePrevue24hMm: 80,
  saturationSignalements: 6, // MODERE = 1, ELEVE = 2
} as const;

export interface EntreeScore {
  scoreBase: number; // 0 → 100
  pluieObservee24hMm?: number | null;
  pluiePrevue24hMm?: number | null;
  signalements?: { niveau?: string }[];
}

const borne = (x: number) => Math.min(1, Math.max(0, x));

export function calculerScore(e: EntreeScore) {
  const P = PARAMETRES;
  const base = Math.min(100, Math.max(0, e.scoreBase));

  const pluie =
    P.partPluieObservee * borne((e.pluieObservee24hMm ?? 0) / P.saturationPluieObservee24hMm) +
    (1 - P.partPluieObservee) * borne((e.pluiePrevue24hMm ?? 0) / P.saturationPluiePrevue24hMm);
  const vulnerabilite = 0.3 + 0.7 * (base / 100);
  const poids = (e.signalements ?? []).reduce(
    (s, sig) => s + (sig.niveau === 'ELEVE' ? 2 : sig.niveau === 'MODERE' ? 1 : 0),
    0,
  );
  const signalements = borne(poids / P.saturationSignalements);

  const intensite = P.poidsPluie * pluie * vulnerabilite + P.poidsSignalements * signalements;
  const score = Math.round(base + (100 - base) * intensite);

  return {
    score,
    niveau: niveauDepuisScore(score),
    details: {
      base,
      pluie: Number(pluie.toFixed(2)),
      vulnerabilite: Number(vulnerabilite.toFixed(2)),
      signalements: Number(signalements.toFixed(2)),
    },
  };
}

export function niveauDepuisScore(score: number): NiveauRisque {
  if (score >= 75) return 'TRES_ELEVE';
  if (score >= 50) return 'ELEVE';
  if (score >= 25) return 'MODERE';
  return 'FAIBLE';
}
