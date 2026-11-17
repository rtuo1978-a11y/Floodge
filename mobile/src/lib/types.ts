// Types alignés sur le contrat d'API (docs/api.md, branche main)

export type Role = 'CITOYEN' | 'SECOURISTE' | 'AUTORITE' | 'ADMIN';
export type NiveauInondation = 'FAIBLE' | 'MODERE' | 'ELEVE';
export type StatutSignalement = 'EN_ATTENTE' | 'CONFIRME' | 'REJETE' | 'RESOLU';
export type NiveauRisque = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'TRES_ELEVE';
export type NiveauAlerte = 'INFO' | 'VIGILANCE' | 'DANGER';
export type StatutSecours = 'EN_ATTENTE' | 'PRISE_EN_CHARGE' | 'TERMINEE' | 'ANNULEE';
export type MomentConseil = 'AVANT' | 'PENDANT' | 'APRES';

export interface Point {
  latitude: number;
  longitude: number;
}

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: Role;
  commune: string | null;
  points: number;
  createdAt: string;
  badges?: { id: string; periode: string; obtenuLe: string; badge: Badge }[];
}

export interface Session {
  accessToken: string;
  user: Utilisateur;
}

export interface Signalement extends Point {
  id: string;
  commune: string | null;
  niveau: NiveauInondation;
  statut: StatutSignalement;
  description: string;
  photoUrl: string | null;
  analyseIa: {
    graviteEstimee: NiveauInondation;
    credibilite: number;
    resume: string;
    besoinSecours: boolean;
  } | null;
  auteur: { id: string; nom: string };
  _count: { confirmations: number };
  zone?: { nom: string; niveau: NiveauRisque } | null;
  createdAt: string;
}

export interface Alerte {
  id: string;
  titre: string;
  message: string;
  texteVocal: string | null;
  niveau: NiveauAlerte;
  type: 'PREVENTION' | 'INONDATION' | 'SECOURS';
  statut: 'BROUILLON' | 'PUBLIEE' | 'ARCHIVEE';
  origine: 'MANUELLE' | 'AUTOMATIQUE';
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  rayonKm: number | null;
  publieeLe: string | null;
  createdAt: string;
  distanceKm?: number | null;
  zone?: { nom: string; commune: string } | null;
}

export interface ZoneFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };
  properties: {
    id: string;
    code: string;
    nom: string;
    commune: string;
    niveau: NiveauRisque;
    score: number;
    estDemo: boolean;
  };
}

export interface DemandeSecours extends Point {
  id: string;
  nbPersonnes: number;
  description: string | null;
  telephone: string | null;
  statut: StatutSecours;
  createdAt: string;
  demandeur?: { nom: string; telephone: string | null };
  secouriste?: { nom: string; telephone?: string | null } | null;
}

export interface Conseil {
  id: string;
  titre: string;
  contenu: string;
  moment: MomentConseil;
}

export interface Badge {
  id: string;
  code: string;
  nom: string;
  description: string;
  icone: string | null;
}

export interface Classement {
  periode: string;
  classement: { rang: number; userId: string; nom: string; commune: string | null; score: number }[];
}

export interface Itineraire {
  description?: string;
  distanceMetres: number;
  dureeSecondes: number;
  polyline: string;
  sur: boolean;
  pointsInondesSurLeTrajet: Point[];
}
