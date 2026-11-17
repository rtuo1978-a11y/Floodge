export interface Point {
  latitude: number;
  longitude: number;
}

const RAYON_TERRE_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance en mètres entre deux points GPS (formule de haversine). */
export function distanceMetres(a: Point, b: Point): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.sqrt(h));
}

/** Centre (moyenne simple) d'un ensemble de points proches. */
export function centre(points: Point[]): Point {
  const n = points.length || 1;
  return {
    latitude: points.reduce((s, p) => s + p.latitude, 0) / n,
    longitude: points.reduce((s, p) => s + p.longitude, 0) / n,
  };
}

/** Rectangle englobant approximatif autour d'un point (pour pré-filtrer en SQL). */
export function boiteAutour(p: Point, rayonM: number) {
  const dLat = rayonM / 111_320;
  const dLon = rayonM / (111_320 * Math.cos(rad(p.latitude)));
  return {
    latMin: p.latitude - dLat,
    latMax: p.latitude + dLat,
    lonMin: p.longitude - dLon,
    lonMax: p.longitude + dLon,
  };
}

type Anneau = number[][]; // [[lng, lat], ...] (ordre GeoJSON)

function dansAnneau(p: Point, anneau: Anneau): boolean {
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    const croise =
      yi > p.latitude !== yj > p.latitude &&
      p.longitude < ((xj - xi) * (p.latitude - yi)) / (yj - yi) + xi;
    if (croise) dedans = !dedans;
  }
  return dedans;
}

/** Le point est-il dans une géométrie GeoJSON Polygon / MultiPolygon ? (trous gérés) */
export function pointDansGeometrie(p: Point, geometrie: unknown): boolean {
  const g = geometrie as { type?: string; coordinates?: unknown };
  const polygones: Anneau[][] =
    g?.type === 'Polygon'
      ? [g.coordinates as Anneau[]]
      : g?.type === 'MultiPolygon'
        ? (g.coordinates as Anneau[][])
        : [];
  return polygones.some(
    ([exterieur, ...trous]) => dansAnneau(p, exterieur) && !trous.some((t) => dansAnneau(p, t)),
  );
}
