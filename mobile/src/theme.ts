/**
 * Design system FlowManage — jetons (tokens).
 * Documentation : design/design-system.md
 *
 * Règle : aucun écran n'utilise de couleur, taille ou espacement « en dur ».
 * Tout passe par ces jetons pour que la charte reste cohérente.
 *
 * Contrastes vérifiés (WCAG AA, texte normal ≥ 4,5:1) : voir design/design-system.md.
 */

// ---------- Couleurs de base (primitives) ----------
const palette = {
  bleu50: '#F0F9FF',
  bleu100: '#E0F2FE',
  bleu200: '#BAE6FD',
  bleu600: '#0284C7',
  bleu700: '#0369A1',
  bleu800: '#075985',
  bleu900: '#0C4A6E',
  ardoise50: '#F4F8FB',
  ardoise100: '#EEF2F6',
  ardoise200: '#E2E8F0',
  ardoise300: '#CBD5E1',
  ardoise500: '#64748B',
  ardoise600: '#475569',
  ardoise900: '#0F172A',
  vert50: '#F0FDF4',
  vert700: '#15803D',
  ambre50: '#FFFBEB',
  ambre100: '#FEF3C7',
  ambre700: '#B45309',
  rouge50: '#FEF2F2',
  rouge100: '#FEE2E2',
  rouge600: '#DC2626',
  rouge700: '#B91C1C',
  rouge900: '#7F1D1D',
  blanc: '#FFFFFF',
};

// ---------- Couleurs sémantiques (à utiliser dans les écrans) ----------
export const couleurs = {
  // marque : le bleu de l'eau, rassurant
  primaire: palette.bleu700,
  primaireFonce: palette.bleu900,
  primairePresse: palette.bleu800,
  primaireDoux: palette.bleu100,
  primaireTresDoux: palette.bleu50,
  secondairePresse: '#CDEAFB',
  surPrimaire: palette.blanc,
  // voiles blancs posés sur un fond bleu ou rouge (statistiques, icônes)
  voileClair: 'rgba(255, 255, 255, 0.12)',
  voileClairFort: 'rgba(255, 255, 255, 0.18)',
  contourClair: 'rgba(255, 255, 255, 0.35)',

  // récompenses (badges, podium)
  or: '#A16207',
  orDoux: '#FEF9C3',
  argent: palette.ardoise600,
  bronze: '#9A3412',

  // surfaces
  fond: palette.ardoise50,
  surface: palette.blanc,
  surfaceAlt: palette.ardoise100,
  bordure: palette.ardoise200,
  bordureForte: palette.ardoise300,

  // texte
  texte: palette.ardoise900,
  texteSecondaire: palette.ardoise600,
  texteDesactive: palette.ardoise500,
  surFonce: palette.blanc,

  // retours
  succes: palette.vert700,
  succesDoux: palette.vert50,
  erreur: palette.rouge700,
  erreurDoux: palette.rouge50,

  // urgence : le rouge est RÉSERVÉ au danger et au SOS
  sos: palette.rouge600,
  sosPresse: palette.rouge700,
  sosDoux: palette.rouge100,

  // niveaux (inondation, risque, alerte) : toujours accompagnés d'une icône et d'un texte
  info: palette.bleu700,
  infoDoux: palette.bleu100,
  faible: palette.vert700,
  faibleDoux: palette.vert50,
  modere: palette.ambre700,
  modereDoux: palette.ambre100,
  eleve: palette.rouge700,
  eleveDoux: palette.rouge50,
  tresEleve: palette.rouge900,
  tresEleveDoux: palette.rouge100,

  voile: 'rgba(15, 23, 42, 0.45)',
};

// ---------- Typographie ----------
// Titres : Lexend (conçue pour la lisibilité) — Texte : Atkinson Hyperlegible
// (conçue pour les personnes malvoyantes, très lisible au soleil et sur petit écran)
export const polices = {
  titre: 'Lexend_700Bold',
  titreDemi: 'Lexend_600SemiBold',
  texte: 'AtkinsonHyperlegible_400Regular',
  texteGras: 'AtkinsonHyperlegible_700Bold',
};

export const typo = {
  affiche: { fontFamily: polices.titre, fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  titre1: { fontFamily: polices.titre, fontSize: 26, lineHeight: 34, letterSpacing: -0.3 },
  titre2: { fontFamily: polices.titreDemi, fontSize: 20, lineHeight: 28 },
  titre3: { fontFamily: polices.titreDemi, fontSize: 17, lineHeight: 24 },
  corps: { fontFamily: polices.texte, fontSize: 16, lineHeight: 24 },
  corpsGras: { fontFamily: polices.texteGras, fontSize: 16, lineHeight: 24 },
  petit: { fontFamily: polices.texte, fontSize: 14, lineHeight: 20 },
  petitGras: { fontFamily: polices.texteGras, fontSize: 14, lineHeight: 20 },
  legende: { fontFamily: polices.texteGras, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  bouton: { fontFamily: polices.titreDemi, fontSize: 16, lineHeight: 22 },
} as const;

export type VarianteTypo = keyof typeof typo;

// ---------- Espacements (rythme de 4 / 8) ----------
export const espace = { xxs: 2, xs: 4, s: 8, sm: 12, m: 16, l: 24, xl: 32, xxl: 48 };

// ---------- Rayons ----------
export const rayon = { s: 8, m: 12, l: 16, xl: 24, rond: 999 };

// ---------- Tailles ----------
export const taille = {
  cible: 48, // zone tactile minimale (Android 48 dp, iOS 44 pt)
  bouton: 52,
  boutonPetit: 44,
  icone: { s: 16, m: 20, l: 24, xl: 32 },
  sos: 168,
};

// ---------- Ombres (élévation) ----------
export const ombre = {
  aucune: {},
  faible: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  moyenne: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  forte: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

// ---------- Mouvement ----------
export const duree = { rapide: 120, normale: 200, lente: 320 };
