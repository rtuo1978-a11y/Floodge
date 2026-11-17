import { couleurs } from '../theme';
import type { NiveauAlerte, NiveauInondation, NiveauRisque, StatutSecours, StatutSignalement } from './types';

export const NIVEAUX_INONDATION: Record<NiveauInondation, { libelle: string; aide: string; couleur: string }> = {
  FAIBLE: { libelle: 'Faible', aide: 'Eau peu profonde', couleur: couleurs.faible },
  MODERE: { libelle: 'Modéré', aide: 'Circulation perturbée', couleur: couleurs.modere },
  ELEVE: { libelle: 'Élevé', aide: 'Danger important', couleur: couleurs.eleve },
};

export const NIVEAUX_RISQUE: Record<NiveauRisque, { libelle: string; couleur: string }> = {
  FAIBLE: { libelle: 'Risque faible', couleur: couleurs.faible },
  MODERE: { libelle: 'Risque modéré', couleur: couleurs.modere },
  ELEVE: { libelle: 'Risque élevé', couleur: couleurs.eleve },
  TRES_ELEVE: { libelle: 'Risque très élevé', couleur: couleurs.tresEleve },
};

export const NIVEAUX_ALERTE: Record<NiveauAlerte, { libelle: string; couleur: string }> = {
  INFO: { libelle: 'Information', couleur: couleurs.info },
  VIGILANCE: { libelle: 'Vigilance', couleur: couleurs.modere },
  DANGER: { libelle: 'Danger', couleur: couleurs.eleve },
};

export const STATUTS_SIGNALEMENT: Record<StatutSignalement, string> = {
  EN_ATTENTE: 'En attente de vérification',
  CONFIRME: 'Confirmé',
  REJETE: 'Rejeté',
  RESOLU: 'Résolu',
};

export const STATUTS_SECOURS: Record<StatutSecours, string> = {
  EN_ATTENTE: 'En attente',
  PRISE_EN_CHARGE: 'Secours en route',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

/** « il y a 5 min », « il y a 2 h », « le 20/11 à 14:05 » */
export function ilYa(dateIso: string) {
  const minutes = Math.round((Date.now() - new Date(dateIso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`;
  const d = new Date(dateIso);
  const deux = (n: number) => String(n).padStart(2, '0');
  return `le ${deux(d.getDate())}/${deux(d.getMonth() + 1)} à ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

export function duree(secondes: number) {
  const min = Math.round(secondes / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
