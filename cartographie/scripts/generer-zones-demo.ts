/**
 * Génère data/zones-abidjan-demo.geojson : zones à risque de DÉMONSTRATION.
 *   npm run zones:generer
 *
 * Les emplacements correspondent à des secteurs connus pour être exposés (bas-fonds,
 * bords de lagune, pentes), mais les contours et les scores sont INDICATIFS.
 * À remplacer par des données vérifiées (historique des inondations, relief, autorités).
 */
import { writeFileSync } from 'node:fs';
import type { NiveauRisque, ZonesCollection } from '../src/types.js';
import { niveauDepuisScore } from '../src/risque/score.js';

interface ZoneDemo {
  code: string;
  nom: string;
  commune: string;
  lat: number;
  lng: number;
  rayonM: number;
  scoreBase: number;
}

const ZONES: ZoneDemo[] = [
  { code: 'ABJ-COCODY-PALMERAIE', nom: 'Riviera Palmeraie (bas-fonds)', commune: 'Cocody', lat: 5.3705, lng: -3.9625, rayonM: 550, scoreBase: 70 },
  { code: 'ABJ-COCODY-ANGRE', nom: 'Angré – Djibi (bas-fonds)', commune: 'Cocody', lat: 5.399, lng: -3.987, rayonM: 500, scoreBase: 62 },
  { code: 'ABJ-ATTECOUBE-MOSSIKRO', nom: 'Mossikro', commune: 'Attécoubé', lat: 5.3485, lng: -4.0405, rayonM: 450, scoreBase: 85 },
  { code: 'ABJ-YOPOUGON-NIANGON', nom: 'Niangon (bas-fonds)', commune: 'Yopougon', lat: 5.3295, lng: -4.0875, rayonM: 600, scoreBase: 50 },
  { code: 'ABJ-ABOBO-GARE', nom: 'Abobo Gare', commune: 'Abobo', lat: 5.4175, lng: -4.0195, rayonM: 550, scoreBase: 45 },
  { code: 'ABJ-ADJAME-WILLIAMSVILLE', nom: 'Williamsville', commune: 'Adjamé', lat: 5.37, lng: -4.023, rayonM: 450, scoreBase: 50 },
  { code: 'ABJ-KOUMASSI-REMBLAIS', nom: 'Remblais', commune: 'Koumassi', lat: 5.296, lng: -3.95, rayonM: 500, scoreBase: 60 },
  { code: 'ABJ-PORTBOUET-GONZAGUEVILLE', nom: 'Gonzagueville', commune: 'Port-Bouët', lat: 5.247, lng: -3.88, rayonM: 600, scoreBase: 45 },
  { code: 'ABJ-MARCORY-ANOUMABO', nom: 'Anoumabo', commune: 'Marcory', lat: 5.3, lng: -3.975, rayonM: 400, scoreBase: 48 },
  { code: 'ABJ-PLATEAU-CENTRE', nom: 'Plateau centre', commune: 'Plateau', lat: 5.3235, lng: -4.0205, rayonM: 450, scoreBase: 15 },
];

/** Polygone irrégulier (12 sommets) pour un rendu plus naturel qu'un cercle. */
function contour(z: ZoneDemo): number[][] {
  const points: number[][] = [];
  const graine = z.code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    const variation = 0.75 + 0.5 * Math.abs(Math.sin(graine + i * 1.7));
    const r = z.rayonM * variation;
    const dLat = (r * Math.sin(angle)) / 111_320;
    const dLng = (r * Math.cos(angle)) / (111_320 * Math.cos((z.lat * Math.PI) / 180));
    points.push([Number((z.lng + dLng).toFixed(6)), Number((z.lat + dLat).toFixed(6))]);
  }
  points.push(points[0]);
  return points;
}

const collection: ZonesCollection = {
  type: 'FeatureCollection',
  features: ZONES.map((z) => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [contour(z)] },
    properties: {
      code: z.code,
      nom: z.nom,
      commune: z.commune,
      scoreBase: z.scoreBase,
      score: z.scoreBase,
      niveau: niveauDepuisScore(z.scoreBase) as NiveauRisque,
      source: 'démonstration',
      estDemo: true,
    },
  })),
};

writeFileSync('data/zones-abidjan-demo.geojson', JSON.stringify(collection, null, 2) + '\n');
console.log(`✔ ${collection.features.length} zones écrites dans data/zones-abidjan-demo.geojson`);
