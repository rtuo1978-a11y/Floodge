import {
  Car,
  CircleCheck,
  CircleExclamationPoint,
  Droplet,
  Hourglass,
  Info,
  OctagonExclamationPoint,
  ShieldCheck,
  TriangleExclamationPoint,
  WavesHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { couleurs } from '../theme';
import type { NiveauAlerte, NiveauInondation, NiveauRisque, StatutSecours, StatutSignalement } from './types';

/** Un niveau est TOUJOURS affiché avec une icône et un texte, jamais par la couleur seule. */
export interface StyleNiveau {
  libelle: string;
  couleur: string;
  doux: string;
  icone: LucideIcon;
}

export const NIVEAUX_INONDATION: Record<NiveauInondation, StyleNiveau & { aide: string }> = {
  FAIBLE: { libelle: 'Faible', aide: 'Eau peu profonde, on peut encore passer', couleur: couleurs.faible, doux: couleurs.faibleDoux, icone: Droplet },
  MODERE: { libelle: 'Modéré', aide: 'Circulation perturbée, eau aux genoux', couleur: couleurs.modere, doux: couleurs.modereDoux, icone: Car },
  ELEVE: { libelle: 'Élevé', aide: 'Danger : maisons envahies, personnes menacées', couleur: couleurs.eleve, doux: couleurs.eleveDoux, icone: WavesHorizontal },
};

export const NIVEAUX_RISQUE: Record<NiveauRisque, StyleNiveau> = {
  FAIBLE: { libelle: 'Risque faible', couleur: couleurs.faible, doux: couleurs.faibleDoux, icone: ShieldCheck },
  MODERE: { libelle: 'Risque modéré', couleur: couleurs.modere, doux: couleurs.modereDoux, icone: CircleExclamationPoint },
  ELEVE: { libelle: 'Risque élevé', couleur: couleurs.eleve, doux: couleurs.eleveDoux, icone: TriangleExclamationPoint },
  TRES_ELEVE: { libelle: 'Risque très élevé', couleur: couleurs.tresEleve, doux: couleurs.tresEleveDoux, icone: OctagonExclamationPoint },
};

export const NIVEAUX_ALERTE: Record<NiveauAlerte, StyleNiveau> = {
  INFO: { libelle: 'Information', couleur: couleurs.info, doux: couleurs.infoDoux, icone: Info },
  VIGILANCE: { libelle: 'Vigilance', couleur: couleurs.modere, doux: couleurs.modereDoux, icone: CircleExclamationPoint },
  DANGER: { libelle: 'Danger', couleur: couleurs.eleve, doux: couleurs.eleveDoux, icone: TriangleExclamationPoint },
};

export const STATUTS_SIGNALEMENT: Record<StatutSignalement, StyleNiveau> = {
  EN_ATTENTE: { libelle: 'En vérification', couleur: couleurs.texteSecondaire, doux: couleurs.surfaceAlt, icone: Hourglass },
  CONFIRME: { libelle: 'Confirmé', couleur: couleurs.succes, doux: couleurs.succesDoux, icone: CircleCheck },
  REJETE: { libelle: 'Rejeté', couleur: couleurs.erreur, doux: couleurs.erreurDoux, icone: X },
  RESOLU: { libelle: 'Résolu', couleur: couleurs.primaire, doux: couleurs.primaireDoux, icone: ShieldCheck },
};

export const STATUTS_SECOURS: Record<StatutSecours, StyleNiveau> = {
  EN_ATTENTE: { libelle: 'En attente', couleur: couleurs.eleve, doux: couleurs.eleveDoux, icone: Hourglass },
  PRISE_EN_CHARGE: { libelle: 'Secours en route', couleur: couleurs.modere, doux: couleurs.modereDoux, icone: Car },
  TERMINEE: { libelle: 'Terminée', couleur: couleurs.succes, doux: couleurs.succesDoux, icone: CircleCheck },
  ANNULEE: { libelle: 'Annulée', couleur: couleurs.texteSecondaire, doux: couleurs.surfaceAlt, icone: X },
};

/** « à l'instant », « il y a 5 min », « il y a 2 h », « le 20/11 à 14:05 » */
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

export function distance(km: number | null | undefined) {
  if (km == null) return null;
  return km < 1 ? `à ${Math.round(km * 1000)} m` : `à ${km.toLocaleString('fr-FR')} km`;
}

export const rang = (n: number) => (n === 1 ? '1er' : `${n}e`);
