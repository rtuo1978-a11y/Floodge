import { calculerScore, niveauDepuisScore } from './score.js';

describe('Score de risque', () => {
  it('vaut le risque de base par temps sec', () => {
    expect(calculerScore({ scoreBase: 70 }).score).toBe(70);
    expect(calculerScore({ scoreBase: 15 }).niveau).toBe('FAIBLE');
  });

  it('augmente avec la pluie, davantage dans une zone vulnérable', () => {
    const fortePluie = { pluieObservee24hMm: 120, pluiePrevue24hMm: 90 };
    const plateau = calculerScore({ scoreBase: 15, ...fortePluie });
    const palmeraie = calculerScore({ scoreBase: 70, ...fortePluie });
    expect(plateau.score).toBeGreaterThan(15);
    expect(plateau.niveau).toBe('MODERE');
    expect(palmeraie.niveau).toBe('TRES_ELEVE');
    expect(palmeraie.score).toBeLessThanOrEqual(100);
  });

  it('prend en compte les signalements même en zone peu exposée', () => {
    const s = calculerScore({
      scoreBase: 15,
      signalements: [{ niveau: 'ELEVE' }, { niveau: 'ELEVE' }, { niveau: 'ELEVE' }],
    });
    expect(s.score).toBeGreaterThanOrEqual(45);
    expect(calculerScore({ scoreBase: 15, signalements: [{ niveau: 'FAIBLE' }] }).score).toBe(15);
  });

  it('convertit un score en niveau', () => {
    expect([10, 30, 60, 90].map(niveauDepuisScore)).toEqual(['FAIBLE', 'MODERE', 'ELEVE', 'TRES_ELEVE']);
  });
});
