/**
 * Logo FlowManage — règles d'usage : docs/marque/README.md (branche main).
 * Symbole : une goutte d'eau dont l'intérieur dessine un « F » formé de deux vagues
 * (le flux — Flow — maîtrisé — Manage).
 */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { couleurs, espace } from '../theme';
import { Texte } from './ui';

/** Symbole seul (icône). Taille minimale : 24. */
export function Logo({ taille = 56 }: { taille?: number }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 64 64" accessibilityLabel="Logo FlowManage">
      <Defs>
        <LinearGradient id="fm-fond" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0284C7" />
          <Stop offset="1" stopColor="#0C4A6E" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="16" fill="url(#fm-fond)" />
      <Path d="M32 7 C 24.5 17.5, 15 27, 15 38 a17 17 0 0 0 34 0 C 49 27, 39.5 17.5, 32 7 Z" fill="#FFFFFF" />
      <Path d="M26.5 49.5 V 31.5" stroke="#0369A1" strokeWidth={4.6} strokeLinecap="round" />
      <Path
        d="M26.5 31.5 c3.2 -3.4 6.4 -3.4 9.6 0 s5.6 3.2 8 0.6"
        stroke="#0369A1"
        strokeWidth={4.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M26.5 41 c2.8 -3 5.6 -3 8.4 0 s4 2.6 5.6 1.2"
        stroke="#0EA5E9"
        strokeWidth={4.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** « Flow » + « Manage » en deux couleurs (Lexend Bold). */
export function NomMarque({ taille = 28, inverse = false }: { taille?: number; inverse?: boolean }) {
  return (
    <Texte
      variante="affiche"
      accessibilityLabel="FlowManage"
      style={{ fontSize: taille, lineHeight: taille * 1.15, letterSpacing: -taille * 0.03 }}
      couleur={inverse ? couleurs.surFonce : couleurs.primaire}
    >
      Flow
      <Texte variante="affiche" style={{ fontSize: taille, letterSpacing: -taille * 0.03 }} couleur={inverse ? '#BAE6FD' : couleurs.texte}>
        Manage
      </Texte>
    </Texte>
  );
}

/** Logo complet : horizontal (par défaut) ou vertical (démarrage, couverture). */
export function LogoComplet({
  taille = 48,
  vertical = false,
  inverse = false,
  signature = false,
}: {
  taille?: number;
  vertical?: boolean;
  inverse?: boolean;
  signature?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel="FlowManage, anticiper, alerter, protéger"
      style={{ flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? espace.m : taille * 0.3 }}
    >
      <Logo taille={taille} />
      <View style={{ alignItems: vertical ? 'center' : 'flex-start' }}>
        <NomMarque taille={vertical ? taille * 0.5 : taille * 0.62} inverse={inverse} />
        {signature ? (
          <Texte variante="petit" couleur={inverse ? couleurs.primaireDoux : couleurs.texteSecondaire} style={{ marginTop: espace.xxs }}>
            Anticiper, alerter, protéger.
          </Texte>
        ) : null}
      </View>
    </View>
  );
}
