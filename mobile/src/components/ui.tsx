/**
 * Composants du design system Floodge.
 * Documentation (variantes, états, accessibilité) : design/design-system.md
 */
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StyleNiveau } from '../lib/format';
import { couleurs, espace, ombre, rayon, taille, typo, type VarianteTypo } from '../theme';

// ============================================================ Texte

export function Texte({
  variante = 'corps',
  couleur = couleurs.texte,
  style,
  ...props
}: TextProps & { variante?: VarianteTypo; couleur?: string; style?: StyleProp<TextStyle> }) {
  return <Text {...props} style={[typo[variante], { color: couleur }, style]} />;
}

// ============================================================ Écran

export function Ecran({
  children,
  titre,
  sousTitre,
  action,
  onRafraichir,
  rafraichissement = false,
  defilable = true,
  avecMarges = true,
  enTeteSysteme = false,
}: {
  children: ReactNode;
  titre?: string;
  sousTitre?: string;
  /** Élément affiché à droite du titre (ex. BoutonIcone) */
  action?: ReactNode;
  onRafraichir?: () => void;
  rafraichissement?: boolean;
  defilable?: boolean;
  avecMarges?: boolean;
  /** true quand la navigation affiche déjà un en-tête (écrans empilés) */
  enTeteSysteme?: boolean;
}) {
  const entete = titre ? (
    <View style={styles.entete}>
      <View style={{ flex: 1 }}>
        <Texte variante="titre1" accessibilityRole="header">
          {titre}
        </Texte>
        {sousTitre ? (
          <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginTop: espace.xxs }}>
            {sousTitre}
          </Texte>
        ) : null}
      </View>
      {action}
    </View>
  ) : null;

  const contenu = avecMarges ? styles.contenu : undefined;
  return (
    <SafeAreaView style={styles.ecran} edges={enTeteSysteme ? ['left', 'right'] : ['top', 'left', 'right']}>
      {defilable ? (
        <ScrollView
          contentContainerStyle={contenu}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRafraichir ? (
              <RefreshControl refreshing={rafraichissement} onRefresh={onRafraichir} tintColor={couleurs.primaire} />
            ) : undefined
          }
        >
          {entete}
          {children}
        </ScrollView>
      ) : (
        <View style={[contenu, { flex: 1 }]}>
          {entete}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================ Boutons

type VarianteBouton = 'primaire' | 'secondaire' | 'contour' | 'danger' | 'fantome';

const STYLES_BOUTON: Record<VarianteBouton, { fond: string; presse: string; texte: string; bordure?: string }> = {
  primaire: { fond: couleurs.primaire, presse: couleurs.primairePresse, texte: couleurs.surPrimaire },
  secondaire: { fond: couleurs.primaireDoux, presse: couleurs.secondairePresse, texte: couleurs.primaireFonce },
  contour: { fond: couleurs.surface, presse: couleurs.surfaceAlt, texte: couleurs.primaire, bordure: couleurs.bordureForte },
  danger: { fond: couleurs.sos, presse: couleurs.sosPresse, texte: couleurs.surFonce },
  fantome: { fond: 'transparent', presse: couleurs.primaireTresDoux, texte: couleurs.primaire },
};

export function Bouton({
  libelle,
  onPress,
  variante = 'primaire',
  petit = false,
  icone: Icone,
  chargement = false,
  desactive = false,
  pleineLargeur = true,
  style,
  accessibilityLabel,
}: {
  libelle: string;
  onPress: () => void;
  variante?: VarianteBouton;
  petit?: boolean;
  icone?: LucideIcon;
  chargement?: boolean;
  desactive?: boolean;
  pleineLargeur?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const s = STYLES_BOUTON[variante];
  const inactif = desactive || chargement;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
      accessibilityState={{ disabled: inactif, busy: chargement }}
      onPress={onPress}
      disabled={inactif}
      style={({ pressed }) => [
        styles.bouton,
        {
          minHeight: petit ? taille.boutonPetit : taille.bouton,
          backgroundColor: desactive ? couleurs.surfaceAlt : pressed ? s.presse : s.fond,
          borderColor: s.bordure ?? 'transparent',
          borderWidth: s.bordure ? 1.5 : 0,
          alignSelf: pleineLargeur ? 'stretch' : 'flex-start',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {chargement ? (
        <ActivityIndicator color={s.texte} />
      ) : (
        <View style={styles.ligneCentree}>
          {Icone ? <Icone size={taille.icone.m} color={desactive ? couleurs.texteDesactive : s.texte} strokeWidth={2.2} /> : null}
          <Texte variante="bouton" couleur={desactive ? couleurs.texteDesactive : s.texte} numberOfLines={2} style={{ textAlign: 'center' }}>
            {libelle}
          </Texte>
        </View>
      )}
    </Pressable>
  );
}

/** Bouton icône seul : 48×48 minimum, libellé obligatoire pour les lecteurs d'écran. */
export function BoutonIcone({
  icone: Icone,
  libelle,
  onPress,
  variante = 'surface',
  style,
}: {
  icone: LucideIcon;
  libelle: string;
  onPress: () => void;
  variante?: 'surface' | 'primaire' | 'transparent';
  style?: StyleProp<ViewStyle>;
}) {
  const fond = { surface: couleurs.surface, primaire: couleurs.primaire, transparent: 'transparent' }[variante];
  const teinte = variante === 'primaire' ? couleurs.surPrimaire : couleurs.primaire;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.boutonIcone,
        { backgroundColor: fond, opacity: pressed ? 0.75 : 1 },
        variante === 'surface' ? ombre.faible : null,
        style,
      ]}
    >
      <Icone size={taille.icone.l} color={teinte} strokeWidth={2} />
    </Pressable>
  );
}

// ============================================================ Champ de saisie

export function Champ({
  libelle,
  aide,
  erreur,
  icone: Icone,
  multiline,
  style,
  ...props
}: TextInputProps & { libelle: string; aide?: string; erreur?: string | null; icone?: LucideIcon }) {
  const [focus, setFocus] = useState(false);
  const bordure = erreur ? couleurs.erreur : focus ? couleurs.primaire : couleurs.bordure;
  return (
    <View style={{ marginBottom: espace.m }}>
      <Texte variante="petitGras" style={{ marginBottom: espace.xs }}>
        {libelle}
      </Texte>
      <View
        style={[
          styles.champ,
          { borderColor: bordure, borderWidth: focus || erreur ? 2 : 1.5, minHeight: multiline ? 104 : taille.bouton },
        ]}
      >
        {Icone ? <Icone size={taille.icone.m} color={focus ? couleurs.primaire : couleurs.texteSecondaire} /> : null}
        <TextInput
          accessibilityLabel={libelle}
          accessibilityHint={aide}
          placeholderTextColor={couleurs.texteDesactive}
          multiline={multiline}
          {...props}
          onFocus={(e) => {
            setFocus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            props.onBlur?.(e);
          }}
          style={[
            typo.corps,
            { flex: 1, color: couleurs.texte, paddingVertical: espace.sm, textAlignVertical: multiline ? 'top' : 'center' },
            // Navigateur : le cadre du champ indique déjà le focus, on retire le contour par défaut
            Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle) : null,
            style,
          ]}
        />
      </View>
      {erreur ? (
        <Texte variante="petit" couleur={couleurs.erreur} style={{ marginTop: espace.xs }} accessibilityLiveRegion="polite">
          {erreur}
        </Texte>
      ) : aide ? (
        <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginTop: espace.xs }}>
          {aide}
        </Texte>
      ) : null}
    </View>
  );
}

// ============================================================ Carte

export function Carte({
  children,
  style,
  onPress,
  accent,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Liseré coloré à gauche (niveau d'alerte, statut) */
  accent?: string;
  accessibilityLabel?: string;
}) {
  const base = [styles.carte, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed ? { backgroundColor: couleurs.primaireTresDoux } : null]}
    >
      {children}
    </Pressable>
  );
}

// ============================================================ Pastille (niveau, statut)

export function Pastille({
  libelle,
  couleur,
  fond,
  icone: Icone,
}: {
  libelle: string;
  couleur: string;
  fond: string;
  icone?: LucideIcon;
}) {
  return (
    <View style={[styles.pastille, { backgroundColor: fond }]}>
      {Icone ? <Icone size={14} color={couleur} strokeWidth={2.5} /> : null}
      <Texte variante="legende" couleur={couleur}>
        {libelle.toUpperCase()}
      </Texte>
    </View>
  );
}

// ============================================================ Bandeau (message)

export function Bandeau({
  texte,
  titre,
  type = 'info',
  icone: Icone,
  onPress,
}: {
  texte: string;
  titre?: string;
  type?: 'info' | 'succes' | 'erreur' | 'vigilance';
  icone?: LucideIcon;
  onPress?: () => void;
}) {
  const c = {
    info: { fond: couleurs.infoDoux, texte: couleurs.primaireFonce },
    succes: { fond: couleurs.succesDoux, texte: couleurs.succes },
    erreur: { fond: couleurs.erreurDoux, texte: couleurs.erreur },
    vigilance: { fond: couleurs.modereDoux, texte: couleurs.modere },
  }[type];
  const contenu = (
    <View style={[styles.bandeau, { backgroundColor: c.fond }]} accessibilityLiveRegion="polite">
      {Icone ? <Icone size={taille.icone.m} color={c.texte} style={{ marginTop: 2 }} /> : null}
      <View style={{ flex: 1 }}>
        {titre ? (
          <Texte variante="corpsGras" couleur={c.texte}>
            {titre}
          </Texte>
        ) : null}
        <Texte variante="petit" couleur={type === 'info' ? couleurs.texte : c.texte}>
          {texte}
        </Texte>
      </View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {contenu}
    </Pressable>
  ) : (
    contenu
  );
}

// ============================================================ En-tête de section

export function EnTeteSection({ titre, action }: { titre: string; action?: ReactNode }) {
  return (
    <View style={styles.enTeteSection}>
      <Texte variante="titre3" accessibilityRole="header" style={{ flex: 1 }}>
        {titre}
      </Texte>
      {action}
    </View>
  );
}

// ============================================================ État vide

export function EtatVide({
  icone: Icone,
  titre,
  texte,
  action,
}: {
  icone: LucideIcon;
  titre: string;
  texte?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.etatVide}>
      <View style={styles.pastilleIcone}>
        <Icone size={taille.icone.xl} color={couleurs.primaire} />
      </View>
      <Texte variante="titre3" style={{ textAlign: 'center' }}>
        {titre}
      </Texte>
      {texte ? (
        <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ textAlign: 'center', marginTop: espace.xs }}>
          {texte}
        </Texte>
      ) : null}
      {action ? <View style={{ marginTop: espace.m, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

// ============================================================ Squelette (chargement)

function useMouvementReduit() {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduit).catch(() => null);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduit);
    return () => sub.remove();
  }, []);
  return reduit;
}

export function Squelette({ hauteur = 96, style }: { hauteur?: number; style?: StyleProp<ViewStyle> }) {
  const opacite = useRef(new Animated.Value(0.55)).current;
  const reduit = useMouvementReduit();
  useEffect(() => {
    if (reduit) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacite, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacite, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacite, reduit]);
  return (
    <Animated.View
      accessibilityLabel="Chargement"
      style={[{ height: hauteur, borderRadius: rayon.l, backgroundColor: couleurs.surfaceAlt, marginBottom: espace.sm, opacity: opacite }, style]}
    />
  );
}

// ============================================================ Segments (choix exclusif)

export function Segments<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { cle: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segments} accessibilityRole="tablist">
      {options.map((o) => {
        const actif = o.cle === valeur;
        return (
          <Pressable
            key={o.cle}
            onPress={() => onChange(o.cle)}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            style={[styles.segment, actif ? [styles.segmentActif, ombre.faible] : null]}
          >
            <Texte variante="petitGras" couleur={actif ? couleurs.primaire : couleurs.texteSecondaire}>
              {o.libelle}
            </Texte>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================ Avatar (initiales)

export function Avatar({ nom, taille: t = 56 }: { nom: string; taille?: number }) {
  const initiales = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join('');
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: t, height: t, borderRadius: t / 2, backgroundColor: couleurs.primaireDoux, alignItems: 'center', justifyContent: 'center' }}
    >
      <Texte variante={t > 48 ? 'titre2' : 'petitGras'} couleur={couleurs.primaireFonce}>
        {initiales}
      </Texte>
    </View>
  );
}

// ============================================================ Ligne de liste

export function LigneListe({
  icone: Icone,
  titre,
  sousTitre,
  onPress,
  droite,
  couleurIcone = couleurs.primaire,
  fondIcone = couleurs.primaireDoux,
}: {
  icone: LucideIcon;
  titre: string;
  sousTitre?: string;
  onPress?: () => void;
  droite?: ReactNode;
  couleurIcone?: string;
  fondIcone?: string;
}) {
  const contenu = (pressed = false) => (
    <View style={[styles.ligneListe, pressed ? { backgroundColor: couleurs.primaireTresDoux } : null]}>
      <View style={[styles.iconeRonde, { backgroundColor: fondIcone }]}>
        <Icone size={taille.icone.m} color={couleurIcone} />
      </View>
      <View style={{ flex: 1 }}>
        <Texte variante="corpsGras">{titre}</Texte>
        {sousTitre ? (
          <Texte variante="petit" couleur={couleurs.texteSecondaire}>
            {sousTitre}
          </Texte>
        ) : null}
      </View>
      {droite}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={titre}>
      {({ pressed }) => contenu(pressed)}
    </Pressable>
  ) : (
    contenu()
  );
}

// ============================================================ Styles

export const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espace.m, paddingBottom: espace.xxl },
  entete: { flexDirection: 'row', alignItems: 'center', gap: espace.sm, marginTop: espace.s, marginBottom: espace.l },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espace.s },
  ligneCentree: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espace.s },
  entre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espace.s },
  bouton: {
    borderRadius: rayon.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espace.l,
    paddingVertical: espace.s,
    marginVertical: espace.xs,
  },
  boutonIcone: {
    width: taille.cible,
    height: taille.cible,
    borderRadius: rayon.rond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.s,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.m,
    paddingHorizontal: espace.m,
  },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.l,
    padding: espace.m,
    marginBottom: espace.sm,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    overflow: 'hidden',
  },
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.xs,
    alignSelf: 'flex-start',
    borderRadius: rayon.rond,
    paddingHorizontal: espace.s,
    paddingVertical: espace.xs,
  },
  bandeau: {
    flexDirection: 'row',
    gap: espace.sm,
    borderRadius: rayon.m,
    padding: espace.m,
    marginBottom: espace.m,
  },
  enTeteSection: { flexDirection: 'row', alignItems: 'center', marginTop: espace.l, marginBottom: espace.sm },
  etatVide: { alignItems: 'center', paddingVertical: espace.xl, paddingHorizontal: espace.l },
  pastilleIcone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: couleurs.primaireDoux,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espace.m,
  },
  segments: {
    flexDirection: 'row',
    backgroundColor: couleurs.surfaceAlt,
    borderRadius: rayon.m,
    padding: espace.xs,
    gap: espace.xs,
  },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: rayon.s },
  segmentActif: { backgroundColor: couleurs.surface },
  ligneListe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    paddingVertical: espace.sm,
    paddingHorizontal: espace.m,
    minHeight: 64,
  },
  iconeRonde: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  separateur: { height: 1, backgroundColor: couleurs.bordure, marginLeft: 68 },
});

// ============================================================ Pastille de niveau


/** Niveau d'inondation, de risque, d'alerte ou statut : icône + texte + couleur. */
export function PastilleNiveau({ s, libelle }: { s: StyleNiveau; libelle?: string }) {
  return <Pastille libelle={libelle ?? s.libelle} couleur={s.couleur} fond={s.doux} icone={s.icone} />;
}
