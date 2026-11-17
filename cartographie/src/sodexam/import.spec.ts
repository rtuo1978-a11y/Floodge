import { readFileSync } from 'node:fs';
import { chargerStations, cumulPluie, lireCsvSodexam } from './import.js';

const stations = chargerStations('data/stations.json');

describe('Import SODEXAM', () => {
  it('lit le fichier d’exemple', () => {
    const csv = readFileSync('data/exemples/sodexam-pluie-exemple.csv', 'utf8');
    const { observations, erreurs } = lireCsvSodexam(csv, stations);
    expect(erreurs).toEqual([]);
    expect(observations).toHaveLength(6);
    const cocody = observations.find((o) => o.stationCode === 'DEMO-COCODY')!;
    expect(cocody.pluieMm).toBe(85.5);
    expect(cocody.niveauEauCm).toBe(35);
    expect(cocody.observeLe).toBe('2026-11-20T12:00:00.000Z');
  });

  it('signale les lignes invalides sans bloquer les autres', () => {
    const csv = [
      'station_code,date_heure,pluie_mm,periode_h,niveau_eau_cm',
      'INCONNUE,2026-11-20 12:00,10,1,',
      'DEMO-ABOBO,pas une date,10,1,',
      'DEMO-ABOBO,2026-11-20 12:00,abc,1,',
      'DEMO-ABOBO,2026-11-20T13:00:00Z,7.5,1,',
    ].join('\n');
    const { observations, erreurs } = lireCsvSodexam(csv, stations);
    expect(observations).toHaveLength(1);
    expect(erreurs.map((e) => e.ligne)).toEqual([2, 3, 4]);
  });

  it('calcule le cumul de pluie sur 24 h', () => {
    const csv = readFileSync('data/exemples/sodexam-pluie-exemple.csv', 'utf8');
    const { observations } = lireCsvSodexam(csv, stations);
    const maintenant = new Date('2026-11-20T18:00:00Z');
    expect(cumulPluie(observations, 'ABJ-AEROPORT', maintenant)).toBeCloseTo(60.4);
    expect(cumulPluie(observations, 'ABJ-AEROPORT', new Date('2026-11-22T18:00:00Z'))).toBe(0);
  });
});
