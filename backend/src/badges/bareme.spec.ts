import { badgesMerites, bornesMois, classer, periodeMois, scoreMensuel } from './bareme.js';

const activite = (userId: string, crees = 0, confirmes = 0, rejetes = 0, confirmations = 0) => ({
  userId,
  signalementsCrees: crees,
  signalementsConfirmes: confirmes,
  signalementsRejetes: rejetes,
  confirmationsDonnees: confirmations,
});

describe('Barème « Meilleur citoyen »', () => {
  it('calcule le score et ne descend jamais sous zéro', () => {
    expect(scoreMensuel(activite('a', 2, 1, 0, 3))).toBe(2 * 5 + 20 + 3 * 2);
    expect(scoreMensuel(activite('b', 1, 0, 3, 0))).toBe(0);
  });

  it('classe par score puis par signalements confirmés', () => {
    const c = classer([activite('a', 4), activite('b', 0, 1), activite('c', 0, 0, 0, 0)]);
    // égalité à 20 pts : b passe devant grâce à son signalement confirmé ; c (0 pt) est exclu
    expect(c.map((x) => x.userId)).toEqual(['b', 'a']);
  });

  it('attribue les badges selon les seuils', () => {
    expect(badgesMerites({ signalementsCrees: 0, signalementsConfirmes: 0, confirmationsDonnees: 0 })).toEqual([]);
    expect(badgesMerites({ signalementsCrees: 6, signalementsConfirmes: 5, confirmationsDonnees: 10 })).toEqual([
      'SENTINELLE',
      'VIGIE_QUARTIER',
      'SOLIDAIRE',
    ]);
  });

  it('gère les périodes mensuelles', () => {
    expect(periodeMois(new Date(2026, 10, 17))).toBe('2026-11');
    const { debut, fin } = bornesMois('2026-12');
    expect(debut.getMonth()).toBe(11);
    expect(fin.getFullYear()).toBe(2027);
  });
});
