import { Bell, Map, Plus, Siren, Volume2, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Rebond } from '../components/anim';
import { LogoComplet } from '../components/Logo';
import { Bouton, Texte } from '../components/ui';
import { useAuth } from '../lib/auth';
import { haptique } from '../lib/haptique';
import { couleurs, espace, ombre, rayon } from '../theme';

interface Page {
  icone: LucideIcon;
  secondaire: LucideIcon;
  couleur: string;
  fond: string;
  titre: string;
  texte: string;
}

const PAGES: Page[] = [
  {
    icone: Map,
    secondaire: Bell,
    couleur: couleurs.primaire,
    fond: couleurs.primaireDoux,
    titre: 'Voyez le risque près de chez vous',
    texte: 'La carte montre les quartiers exposés, les rues inondées et les alertes en cours, mises à jour avec les données de la SODEXAM.',
  },
  {
    icone: Plus,
    secondaire: Volume2,
    couleur: couleurs.modere,
    fond: couleurs.modereDoux,
    titre: 'Signalez en 30 secondes',
    texte:
      "Une position, un niveau d'eau, une photo : vos voisins et les secours sont prévenus. Les meilleurs citoyens gagnent un badge chaque mois.",
  },
  {
    icone: Siren,
    secondaire: Volume2,
    couleur: couleurs.sos,
    fond: couleurs.sosDoux,
    titre: 'Alerté à temps, secouru vite',
    texte: 'Les alertes sont lues à voix haute. En cas de danger, le bouton SOS envoie votre position aux équipes de secours.',
  },
];

export default function Bienvenue() {
  const { terminerBienvenue } = useAuth();
  const { width } = useWindowDimensions();
  const defilement = useRef(new Animated.Value(0)).current;
  const liste = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const derniere = page === PAGES.length - 1;

  function aller(i: number) {
    liste.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
    haptique.selection();
  }

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.haut}>
        <LogoComplet taille={36} />
        {!derniere ? (
          <Pressable onPress={terminerBienvenue} accessibilityRole="button" hitSlop={12} style={styles.passer}>
            <Texte variante="petitGras" couleur={couleurs.texteSecondaire}>
              Passer
            </Texte>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={liste}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: defilement } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, i) => (
          <View key={p.titre} style={[styles.page, { width }]} accessibilityLabel={`Page ${i + 1} sur ${PAGES.length}`}>
            <View style={styles.illustration}>
              <Svg width={width} height={48} viewBox="0 0 400 48" preserveAspectRatio="none" style={styles.vagues}>
                <Path d="M0 24 C 60 6, 120 42, 200 24 S 340 6, 400 24 L 400 48 L 0 48 Z" fill={p.fond} opacity={0.7} />
                <Path d="M0 34 C 70 20, 130 48, 210 34 S 340 20, 400 34 L 400 48 L 0 48 Z" fill={p.fond} />
              </Svg>
              <Rebond actif={page === i}>
                <View style={[styles.cercle, { backgroundColor: p.fond }]}>
                  <View style={[styles.disque, { backgroundColor: p.couleur }, ombre.forte]}>
                    <p.icone size={56} color={couleurs.surFonce} strokeWidth={2} />
                  </View>
                  <View style={[styles.satellite, ombre.moyenne]}>
                    <p.secondaire size={24} color={p.couleur} />
                  </View>
                </View>
              </Rebond>
            </View>
            <Texte variante="titre1" style={{ textAlign: 'center' }} accessibilityRole="header">
              {p.titre}
            </Texte>
            <Texte variante="corps" couleur={couleurs.texteSecondaire} style={{ textAlign: 'center', marginTop: espace.sm }}>
              {p.texte}
            </Texte>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.bas}>
        <View style={styles.points} accessibilityRole="adjustable" accessibilityLabel={`Page ${page + 1} sur ${PAGES.length}`}>
          {PAGES.map((p, i) => {
            const largeur = defilement.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const opacite = defilement.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Pressable key={p.titre} onPress={() => aller(i)} hitSlop={10} accessibilityLabel={`Aller à la page ${i + 1}`}>
                <Animated.View style={[styles.point, { width: largeur, opacity: opacite }]} />
              </Pressable>
            );
          })}
        </View>
        <Bouton
          libelle={derniere ? 'Commencer' : 'Suivant'}
          onPress={() => {
            if (derniere) {
              haptique.succes();
              void terminerBienvenue();
            } else aller(page + 1);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espace.m, paddingTop: espace.s },
  passer: { minHeight: 44, justifyContent: 'center', paddingHorizontal: espace.s },
  page: { paddingHorizontal: espace.l, justifyContent: 'center' },
  illustration: { height: 320, alignItems: 'center', justifyContent: 'flex-start', paddingTop: espace.m, marginBottom: espace.l },
  vagues: { position: 'absolute', bottom: 0, left: -espace.l },
  cercle: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  disque: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: couleurs.surface,
  },
  satellite: {
    position: 'absolute',
    right: 18,
    top: 26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bas: { paddingHorizontal: espace.m, paddingBottom: espace.m, gap: espace.m },
  points: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: espace.s, minHeight: 24 },
  point: { height: 8, borderRadius: rayon.rond, backgroundColor: couleurs.primaire },
});
