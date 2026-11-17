import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export type NiveauRisque = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'TRES_ELEVE';

export interface Point {
  latitude: number;
  longitude: number;
}

export interface ProprietesZone {
  code: string;
  nom: string;
  commune: string;
  /** Risque intrinsèque 0 → 100 (relief, historique, bas-fonds…) */
  scoreBase: number;
  niveau: NiveauRisque;
  /** Score courant 0 → 100 (après pluie et signalements) */
  score: number;
  source: string;
  estDemo: boolean;
}

export type ZoneFeature = Feature<Polygon | MultiPolygon, ProprietesZone>;
export type ZonesCollection = FeatureCollection<Polygon | MultiPolygon, ProprietesZone>;

export interface Station extends Point {
  code: string;
  nom: string;
  commune: string;
  estDemo: boolean;
}

export interface Observation extends Point {
  source: string;
  stationCode: string;
  stationNom?: string;
  pluieMm?: number;
  periodeH: number;
  niveauEauCm?: number;
  observeLe: string; // ISO 8601
}

export interface PointInonde extends Point {
  id?: string;
  niveau?: 'FAIBLE' | 'MODERE' | 'ELEVE';
  createdAt?: string;
}
