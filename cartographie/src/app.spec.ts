import request from 'supertest';
import { creerApp } from './app.js';
import { config } from './config.js';
import { chargerStations } from './sodexam/import.js';
import { ZonesStore } from './zones/zones.js';

const app = creerApp(new ZonesStore('data/zones-abidjan-demo.geojson'), chargerStations());

describe('API cartographie', () => {
  it('renvoie les zones en GeoJSON', async () => {
    const res = await request(app).get('/zones').expect(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features.length).toBeGreaterThanOrEqual(10);
  });

  it('localise un point dans une zone à risque', async () => {
    const res = await request(app).get('/zones/localiser?lat=5.3705&lng=-3.9625').expect(200);
    expect(res.body.zone.code).toBe('ABJ-COCODY-PALMERAIE');
    expect(res.body.commune).toBe('Cocody');
  });

  it('trouve la commune la plus proche hors zone à risque', async () => {
    const res = await request(app).get('/zones/localiser?lat=5.30&lng=-4.005').expect(200);
    expect(res.body.zone).toBeNull();
    expect(res.body.commune).toBe('Treichville');
  });

  it('refuse une position invalide', async () => {
    await request(app).get('/zones/localiser?lat=abc&lng=1').expect(400);
  });

  it('simule un scénario de forte pluie', async () => {
    const res = await request(app)
      .get('/risque/simuler?code=ABJ-COCODY-PALMERAIE&pluie=120&prevision=60&eleves=2')
      .expect(200);
    expect(res.body.niveau).toBe('TRES_ELEVE');
  });

  it('protège les routes internes par la clé', async () => {
    if (!config.cleInterne) return;
    await request(app).post('/risque/recalculer').expect(401);
  });

  it('importe un CSV SODEXAM', async () => {
    const csv = 'station_code;date_heure;pluie_mm;periode_h;niveau_eau_cm\nDEMO-COCODY;2026-11-20 12:00;30;3;\n';
    const res = await request(app).post('/sodexam/import').set('x-api-key', config.cleInterne).set('content-type', 'text/csv').send(csv).expect(200);
    expect(res.body.lues).toBe(1);
  });

  it('itinéraire sûr : 503 sans clé Google', async () => {
    await request(app)
      .post('/itineraires/sur')
      .set('x-api-key', config.cleInterne)
      .send({ origine: { latitude: 5.32, longitude: -4.02 }, destination: { latitude: 5.37, longitude: -3.96 } })
      .expect(503);
  });
});
