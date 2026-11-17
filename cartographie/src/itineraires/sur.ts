import { lineString, point, pointToLineDistance } from '@turf/turf';
import type { RouteGoogle } from '../google.js';
import type { PointInonde } from '../types.js';

/** Distance en dessous de laquelle un point inondé « touche » l'itinéraire. */
export const MARGE_M = 150;

export interface ItineraireEvalue {
  description?: string;
  distanceMetres: number;
  dureeSecondes: number;
  polyline: string;
  sur: boolean;
  pointsInondesSurLeTrajet: PointInonde[];
}

/**
 * Classe les itinéraires proposés par Google : d'abord ceux qui ne passent près
 * d'aucun point inondé, puis par nombre de points touchés, puis par durée.
 */
export function evaluerItineraires(routes: RouteGoogle[], pointsInondes: PointInonde[], margeM = MARGE_M) {
  const evalues: ItineraireEvalue[] = routes
    .filter((r) => r.points.length >= 2)
    .map((r) => {
      const ligne = lineString(r.points.map((p) => [p.longitude, p.latitude]));
      const touches = pointsInondes.filter(
        (p) => pointToLineDistance(point([p.longitude, p.latitude]), ligne, { units: 'meters' }) <= margeM,
      );
      return {
        description: r.description,
        distanceMetres: r.distanceMetres,
        dureeSecondes: r.dureeSecondes,
        polyline: r.polyline,
        sur: touches.length === 0,
        pointsInondesSurLeTrajet: touches,
      };
    })
    .sort(
      (a, b) =>
        a.pointsInondesSurLeTrajet.length - b.pointsInondesSurLeTrajet.length || a.dureeSecondes - b.dureeSecondes,
    );

  return {
    itineraires: evalues,
    recommande: evalues[0] ?? null,
    avertissement:
      evalues.length && !evalues[0].sur
        ? "Aucun itinéraire n'évite tous les points inondés signalés. Si possible, reportez votre déplacement."
        : null,
  };
}
