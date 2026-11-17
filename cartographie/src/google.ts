import { config } from './config.js';
import type { Point } from './types.js';

/** Décode une polyline encodée Google (algorithme officiel, précision 1e-5). */
export function decoderPolyline(encodee: string): Point[] {
  const points: Point[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const suivant = () => {
    let resultat = 0;
    let decalage = 0;
    let octet: number;
    do {
      octet = encodee.charCodeAt(index++) - 63;
      resultat |= (octet & 0x1f) << decalage;
      decalage += 5;
    } while (octet >= 0x20);
    return resultat & 1 ? ~(resultat >> 1) : resultat >> 1;
  };
  while (index < encodee.length) {
    lat += suivant();
    lng += suivant();
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export class GoogleMapsIndisponible extends Error {
  constructor(message = 'GOOGLE_MAPS_API_KEY non configurée') {
    super(message);
  }
}

export interface RouteGoogle {
  description?: string;
  distanceMetres: number;
  dureeSecondes: number;
  polyline: string;
  /** Points [lat, lng] décodés depuis la polyline */
  points: Point[];
}

/**
 * Google Routes API (remplace l'ancienne Directions API).
 * Console Google Cloud : activer « Routes API ».
 */
export async function calculerRoutes(
  origine: Point,
  destination: Point,
  mode: 'driving' | 'walking' = 'driving',
): Promise<RouteGoogle[]> {
  if (!config.googleMapsKey) throw new GoogleMapsIndisponible();

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': config.googleMapsKey,
      'X-Goog-FieldMask': 'routes.description,routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: origine } },
      destination: { location: { latLng: destination } },
      travelMode: mode === 'walking' ? 'WALK' : 'DRIVE',
      computeAlternativeRoutes: true,
      languageCode: 'fr',
      regionCode: 'CI',
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Routes API : HTTP ${res.status} ${await res.text()}`);

  const json = (await res.json()) as {
    routes?: { description?: string; distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[];
  };
  return (json.routes ?? []).map((r) => {
    const polyline = r.polyline?.encodedPolyline ?? '';
    return {
      description: r.description,
      distanceMetres: r.distanceMeters ?? 0,
      dureeSecondes: Number.parseInt(r.duration ?? '0', 10),
      polyline,
      points: decoderPolyline(polyline),
    };
  });
}

/**
 * Commune d'un point via Google Geocoding (si la clé est configurée).
 * Console Google Cloud : activer « Geocoding API ».
 */
export async function communeGoogle(p: Point): Promise<string | null> {
  if (!config.googleMapsKey) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${p.latitude},${p.longitude}` +
      `&language=fr&result_type=sublocality|locality&key=${config.googleMapsKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    const json = (await res.json()) as {
      results?: { address_components: { long_name: string; types: string[] }[] }[];
    };
    for (const r of json.results ?? []) {
      const comp = r.address_components.find((c) => c.types.includes('sublocality') || c.types.includes('locality'));
      if (comp) return comp.long_name;
    }
  } catch {
    /* repli sur la commune la plus proche */
  }
  return null;
}
