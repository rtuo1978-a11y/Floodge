import { booleanPointInPolygon, centroid, distance, point } from '@turf/turf';
import { readFileSync } from 'node:fs';
import { config } from '../config.js';
import type { Point, ProprietesZone, ZoneFeature, ZonesCollection } from '../types.js';

interface Commune extends Point {
  nom: string;
}

const lireJson = <T>(chemin: string): T => JSON.parse(readFileSync(chemin, 'utf8')) as T;

/** Zones à risque chargées en mémoire (fichier GeoJSON), mises à jour par le recalcul du risque. */
export class ZonesStore {
  private zones: ZoneFeature[];
  private readonly communes: Commune[];

  constructor(fichierZones = config.fichierZones, fichierCommunes = 'data/communes-abidjan.json') {
    this.zones = lireJson<ZonesCollection>(fichierZones).features;
    this.communes = lireJson<{ communes: Commune[] }>(fichierCommunes).communes;
  }

  toutes(commune?: string): ZonesCollection {
    return {
      type: 'FeatureCollection',
      features: commune ? this.zones.filter((z) => z.properties.commune === commune) : this.zones,
    };
  }

  parCode(code: string) {
    return this.zones.find((z) => z.properties.code === code);
  }

  majRisque(code: string, maj: Pick<ProprietesZone, 'score' | 'niveau'>) {
    const zone = this.parCode(code);
    if (zone) Object.assign(zone.properties, maj);
    return zone;
  }

  /** Zone à risque qui contient le point (la plus risquée si plusieurs se chevauchent). */
  zoneContenant(p: Point): ZoneFeature | null {
    const pt = point([p.longitude, p.latitude]);
    const trouvees = this.zones.filter((z) => booleanPointInPolygon(pt, z));
    return trouvees.sort((a, b) => b.properties.score - a.properties.score)[0] ?? null;
  }

  /** Commune la plus proche (approximation par le centre de commune, à moins de 8 km). */
  communeProche(p: Point): string | null {
    const pt = point([p.longitude, p.latitude]);
    let meilleure: { nom: string; km: number } | null = null;
    for (const c of this.communes) {
      const km = distance(pt, point([c.longitude, c.latitude]), { units: 'kilometers' });
      if (!meilleure || km < meilleure.km) meilleure = { nom: c.nom, km };
    }
    return meilleure && meilleure.km <= 8 ? meilleure.nom : null;
  }

  centre(zone: ZoneFeature): Point {
    const [longitude, latitude] = centroid(zone).geometry.coordinates;
    return { latitude, longitude };
  }

  /** Format attendu par POST /interne/zones/import du back-end. */
  pourBackend() {
    return this.zones.map((z) => ({
      code: z.properties.code,
      nom: z.properties.nom,
      commune: z.properties.commune,
      geometrie: z.geometry,
      niveau: z.properties.niveau,
      score: z.properties.score,
      source: z.properties.source,
      estDemo: z.properties.estDemo,
    }));
  }
}
