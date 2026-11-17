/**
 * Animations du design system FlowManage.
 * Toutes respectent l'option système « Réduire les animations » : l'état final s'affiche directement.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { couleurs, duree, rayon } from '../theme';

export function useMouvementReduit() {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduit)
      .catch(() => null);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduit);
    return () => sub.remove();
  }, []);
  return reduit;
}

/** Apparition douce (fondu + léger glissement vers le haut), décalée selon la position dans la liste. */
export function Apparition({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  const reduit = useMouvementReduit();
  const progres = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduit) {
      progres.setValue(1);
      return;
    }
    Animated.timing(progres, {
      toValue: 1,
      duration: duree.lente,
      delay: Math.min(index, 8) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progres, index, reduit]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progres,
          transform: [{ translateY: progres.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Apparition « ressort » (icône de succès, badge débloqué). */
export function Rebond({ children, actif = true }: { children: ReactNode; actif?: boolean }) {
  const reduit = useMouvementReduit();
  const echelle = useRef(new Animated.Value(reduit ? 1 : 0.4)).current;
  useEffect(() => {
    if (!actif) return;
    if (reduit) {
      echelle.setValue(1);
      return;
    }
    echelle.setValue(0.4);
    Animated.spring(echelle, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [actif, echelle, reduit]);
  return <Animated.View style={{ transform: [{ scale: echelle }] }}>{children}</Animated.View>;
}

/** Barre de progression animée (progression vers un badge). */
export function BarreProgression({
  valeur,
  couleur = couleurs.primaire,
  fond = couleurs.primaireDoux,
  hauteur = 10,
}: {
  valeur: number; // 0 → 1
  couleur?: string;
  fond?: string;
  hauteur?: number;
}) {
  const reduit = useMouvementReduit();
  const largeur = useRef(new Animated.Value(0)).current;
  const cible = Math.max(0, Math.min(1, valeur));
  useEffect(() => {
    if (reduit) {
      largeur.setValue(cible);
      return;
    }
    Animated.timing(largeur, { toValue: cible, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [cible, largeur, reduit]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(cible * 100) }}
      style={{ height: hauteur, borderRadius: rayon.rond, backgroundColor: fond, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: rayon.rond,
          backgroundColor: couleur,
          width: largeur.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
