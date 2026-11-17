import { distanceMetres, pointDansGeometrie } from './geo.js';

describe('Outils géographiques', () => {
  it('calcule une distance réaliste (Plateau → Riviera Palmeraie ≈ 8 km)', () => {
    const d = distanceMetres({ latitude: 5.3235, longitude: -4.0205 }, { latitude: 5.3705, longitude: -3.9625 });
    expect(d).toBeGreaterThan(8000);
    expect(d).toBeLessThan(9000);
  });

  const carre = {
    type: 'Polygon',
    coordinates: [
      [
        [-4.0, 5.3],
        [-3.9, 5.3],
        [-3.9, 5.4],
        [-4.0, 5.4],
        [-4.0, 5.3],
      ],
      // trou au centre
      [
        [-3.96, 5.34],
        [-3.94, 5.34],
        [-3.94, 5.36],
        [-3.96, 5.36],
        [-3.96, 5.34],
      ],
    ],
  };

  it('détecte un point dans un polygone (hors trou)', () => {
    expect(pointDansGeometrie({ latitude: 5.32, longitude: -3.98 }, carre)).toBe(true);
    expect(pointDansGeometrie({ latitude: 5.35, longitude: -3.95 }, carre)).toBe(false); // dans le trou
    expect(pointDansGeometrie({ latitude: 5.5, longitude: -3.95 }, carre)).toBe(false);
  });

  it('gère les MultiPolygon et les géométries inconnues', () => {
    const multi = { type: 'MultiPolygon', coordinates: [carre.coordinates.slice(0, 1)] };
    expect(pointDansGeometrie({ latitude: 5.35, longitude: -3.95 }, multi)).toBe(true);
    expect(pointDansGeometrie({ latitude: 5.35, longitude: -3.95 }, { type: 'Point' })).toBe(false);
  });
});
