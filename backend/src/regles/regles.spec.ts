import { evaluer, type SignalementRegle } from './regles.js';

const maintenant = new Date('2026-11-20T15:00:00Z');
const ilYa = (minutes: number) => new Date(maintenant.getTime() - minutes * 60_000);

// Cocody, Riviera Palmeraie (coordonnées de test)
const base = { latitude: 5.3712, longitude: -3.9645 };

function sig(partiel: Partial<SignalementRegle> & { id: string; auteurId: string }): SignalementRegle {
  return {
    ...base,
    niveau: 'MODERE',
    statut: 'EN_ATTENTE',
    createdAt: ilYa(10),
    confirmateurs: [],
    ...partiel,
  };
}

describe('Moteur de règles', () => {
  it("ne déclenche rien avec un seul signalement", () => {
    const d = evaluer(sig({ id: 's1', auteurId: 'a' }), [], [], maintenant);
    expect(d.declencher).toBe(false);
  });

  it('propose une VIGILANCE avec 3 auteurs différents à moins de 500 m', () => {
    const nouveau = sig({ id: 's3', auteurId: 'c', latitude: 5.3715 });
    const recents = [sig({ id: 's1', auteurId: 'a' }), sig({ id: 's2', auteurId: 'b', longitude: -3.9648 })];
    const d = evaluer(nouveau, recents, [], maintenant);
    expect(d.declencher).toBe(true);
    if (d.declencher) {
      expect(d.niveau).toBe('VIGILANCE');
      expect(d.nbSources).toBe(3);
    }
  });

  it('compte les confirmations comme des sources', () => {
    const nouveau = sig({ id: 's1', auteurId: 'a', confirmateurs: ['b', 'c'] });
    expect(evaluer(nouveau, [], [], maintenant).declencher).toBe(true);
  });

  it("ne compte pas deux fois le même auteur", () => {
    const nouveau = sig({ id: 's3', auteurId: 'a' });
    const recents = [sig({ id: 's1', auteurId: 'a' }), sig({ id: 's2', auteurId: 'b' })];
    expect(evaluer(nouveau, recents, [], maintenant).declencher).toBe(false);
  });

  it('propose DANGER à partir de 2 signalements ELEVE', () => {
    const nouveau = sig({ id: 's3', auteurId: 'c', niveau: 'ELEVE' });
    const recents = [sig({ id: 's1', auteurId: 'a', niveau: 'ELEVE' }), sig({ id: 's2', auteurId: 'b' })];
    const d = evaluer(nouveau, recents, [], maintenant);
    expect(d.declencher && d.niveau).toBe('DANGER');
  });

  it('ignore les signalements trop anciens, trop loin, FAIBLE ou rejetés', () => {
    const nouveau = sig({ id: 's0', auteurId: 'z' });
    const recents = [
      sig({ id: 's1', auteurId: 'a', createdAt: ilYa(180) }), // > 2 h
      sig({ id: 's2', auteurId: 'b', latitude: 5.39 }), // ~2 km
      sig({ id: 's3', auteurId: 'c', niveau: 'FAIBLE' }),
      sig({ id: 's4', auteurId: 'd', statut: 'REJETE' }),
    ];
    expect(evaluer(nouveau, recents, [], maintenant).declencher).toBe(false);
  });

  it("ne crée pas de doublon si une alerte récente existe à moins de 1 km", () => {
    const nouveau = sig({ id: 's1', auteurId: 'a', confirmateurs: ['b', 'c'] });
    const alertes = [{ ...base, latitude: 5.374, createdAt: ilYa(60) }];
    const d = evaluer(nouveau, [], alertes, maintenant);
    expect(d.declencher).toBe(false);
  });
});
