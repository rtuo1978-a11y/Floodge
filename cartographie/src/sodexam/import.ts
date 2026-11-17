import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import type { Observation, Station } from '../types.js';

/**
 * Import des relevés SODEXAM (ou de toute autre source) au format CSV.
 *
 * Colonnes attendues (séparateur « ; » ou « , », décimales « , » ou « . ») :
 *   station_code ; date_heure ; pluie_mm ; periode_h ; niveau_eau_cm
 *
 *   - date_heure : "2026-11-20 12:00" (heure d'Abidjan = UTC) ou ISO 8601
 *   - pluie_mm   : cumul de pluie sur la période
 *   - periode_h  : durée de la période en heures (défaut 1)
 *   - niveau_eau_cm : optionnel (capteur de niveau d'eau)
 *
 * Exemple : data/exemples/sodexam-pluie-exemple.csv
 */
export interface ResultatImport {
  observations: Observation[];
  erreurs: { ligne: number; message: string }[];
}

const nombre = (v: unknown): number | undefined => {
  if (v === undefined || v === null || String(v).trim() === '') return undefined;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : Number.NaN;
};

function dateIso(v: string): string | null {
  const texte = v.trim();
  // "2026-11-20 12:00" → heure d'Abidjan (UTC+0)
  const normalise = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(texte) ? `${texte.replace(' ', 'T')}Z` : texte;
  const d = new Date(normalise);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function lireCsvSodexam(contenu: string, stations: Station[], source = 'SODEXAM'): ResultatImport {
  const delimiter = contenu.split('\n')[0].includes(';') ? ';' : ',';
  const lignes = parse(contenu, { columns: true, delimiter, skip_empty_lines: true, trim: true, bom: true }) as Record<
    string,
    string
  >[];
  const parCode = new Map(stations.map((s) => [s.code, s]));

  const observations: Observation[] = [];
  const erreurs: ResultatImport['erreurs'] = [];

  lignes.forEach((l, i) => {
    const ligne = i + 2; // + en-tête, numérotation à partir de 1
    const station = parCode.get(l.station_code);
    if (!station) return erreurs.push({ ligne, message: `Station inconnue : ${l.station_code}` });

    const observeLe = dateIso(l.date_heure ?? '');
    if (!observeLe) return erreurs.push({ ligne, message: `Date invalide : ${l.date_heure}` });

    const pluieMm = nombre(l.pluie_mm);
    const niveauEauCm = nombre(l.niveau_eau_cm);
    const periodeH = nombre(l.periode_h) ?? 1;
    if ([pluieMm, niveauEauCm, periodeH].some((n) => Number.isNaN(n))) {
      return erreurs.push({ ligne, message: 'Valeur numérique invalide' });
    }
    if (pluieMm !== undefined && pluieMm < 0) return erreurs.push({ ligne, message: 'Pluie négative' });

    observations.push({
      source,
      stationCode: station.code,
      stationNom: station.nom,
      latitude: station.latitude,
      longitude: station.longitude,
      pluieMm,
      niveauEauCm,
      periodeH: Math.max(1, Math.round(periodeH!)),
      observeLe,
    });
  });

  return { observations, erreurs };
}

export function chargerStations(fichier = 'data/stations.json'): Station[] {
  return (JSON.parse(readFileSync(fichier, 'utf8')) as { stations: Station[] }).stations;
}

/** Cumul de pluie sur les `heures` précédant `maintenant` pour une station. */
export function cumulPluie(observations: Observation[], stationCode: string, maintenant = new Date(), heures = 24) {
  const debut = maintenant.getTime() - heures * 3_600_000;
  return observations
    .filter((o) => o.stationCode === stationCode && o.pluieMm !== undefined)
    .filter((o) => {
      const t = new Date(o.observeLe).getTime();
      return t > debut && t <= maintenant.getTime();
    })
    .reduce((s, o) => s + (o.pluieMm ?? 0), 0);
}
