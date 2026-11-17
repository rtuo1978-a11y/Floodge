import type { RouteGoogle } from '../google.js';
import { evaluerItineraires } from './sur.js';

// Deux trajets fictifs Plateau → Cocody : un par le nord, un par le sud
const route = (description: string, lat: number, duree: number): RouteGoogle => ({
  description,
  distanceMetres: 8000,
  dureeSecondes: duree,
  polyline: '',
  points: [
    { latitude: 5.3235, longitude: -4.02 },
    { latitude: lat, longitude: -3.99 },
    { latitude: 5.3705, longitude: -3.9625 },
  ],
});

describe('Itinéraires sûrs', () => {
  const nord = route('Par le nord', 5.36, 900);
  const sud = route('Par le sud', 5.33, 1100);

  it('recommande le trajet qui évite les points inondés, même plus long', () => {
    const inonde = [{ latitude: 5.36, longitude: -3.99, niveau: 'ELEVE' as const }];
    const r = evaluerItineraires([nord, sud], inonde);
    expect(r.recommande?.description).toBe('Par le sud');
    expect(r.recommande?.sur).toBe(true);
    expect(r.itineraires[1].pointsInondesSurLeTrajet).toHaveLength(1);
    expect(r.avertissement).toBeNull();
  });

  it('prend le plus rapide quand rien n’est inondé', () => {
    expect(evaluerItineraires([sud, nord], []).recommande?.description).toBe('Par le nord');
  });

  it('avertit quand aucun trajet n’est sûr', () => {
    const inondes = [
      { latitude: 5.36, longitude: -3.99 },
      { latitude: 5.33, longitude: -3.99 },
    ];
    const r = evaluerItineraires([nord, sud], inondes);
    expect(r.recommande?.sur).toBe(false);
    expect(r.avertissement).toContain('Aucun itinéraire');
  });
});

describe('Polyline Google', () => {
  it('décode l’exemple de la documentation Google', async () => {
    const { decoderPolyline } = await import('../google.js');
    expect(decoderPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });
});
