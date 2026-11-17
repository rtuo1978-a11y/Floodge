import * as Location from 'expo-location';
import type { Point } from './types';

/** Centre d'Abidjan, utilisé si la position n'est pas disponible. */
export const ABIDJAN: Point = { latitude: 5.345, longitude: -4.01 };

/** Position GPS actuelle (demande l'autorisation si besoin). null si refusée. */
export async function positionActuelle(): Promise<Point | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  try {
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: p.coords.latitude, longitude: p.coords.longitude };
  } catch {
    const derniere = await Location.getLastKnownPositionAsync();
    return derniere ? { latitude: derniere.coords.latitude, longitude: derniere.coords.longitude } : null;
  }
}

/** Décode une polyline Google (itinéraires). */
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
