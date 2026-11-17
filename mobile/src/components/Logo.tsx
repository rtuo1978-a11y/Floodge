import Svg, { Path, Rect } from 'react-native-svg';
import { couleurs } from '../theme';

/** Logo Floodge : une goutte protégée, au-dessus d'une vague. */
export function Logo({ taille = 56, inverse = false }: { taille?: number; inverse?: boolean }) {
  const fond = inverse ? couleurs.surface : couleurs.primaire;
  const motif = inverse ? couleurs.primaire : couleurs.surface;
  return (
    <Svg width={taille} height={taille} viewBox="0 0 64 64" accessibilityLabel="Logo Floodge">
      <Rect x="0" y="0" width="64" height="64" rx="18" fill={fond} />
      <Path d="M32 11 C 26 20, 19 27, 19 35 a13 13 0 0 0 26 0 C 45 27, 38 20, 32 11 Z" fill={motif} />
      <Path
        d="M24 36 c 2.7 -2.4 5.3 -2.4 8 0 s 5.3 2.4 8 0"
        stroke={fond}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M10 52 c 3.7 -3 7.3 -3 11 0 s 7.3 3 11 0 s 7.3 -3 11 0 s 7.3 3 11 0"
        stroke={motif}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
    </Svg>
  );
}
