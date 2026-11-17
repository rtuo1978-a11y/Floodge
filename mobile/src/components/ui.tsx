/**
 * Composants de base, volontairement sobres en attendant les maquettes Figma.
 */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { couleurs, espace, police, rayon } from '../theme';

export function Ecran({
  children,
  titre,
  onRafraichir,
  rafraichissement = false,
  defilable = true,
}: {
  children: ReactNode;
  titre?: string;
  onRafraichir?: () => void;
  rafraichissement?: boolean;
  defilable?: boolean;
}) {
  const contenu = (
    <>
      {titre ? <Text style={styles.titreEcran}>{titre}</Text> : null}
      {children}
    </>
  );
  return (
    <SafeAreaView style={styles.ecran} edges={['top', 'left', 'right']}>
      {defilable ? (
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRafraichir ? <RefreshControl refreshing={rafraichissement} onRefresh={onRafraichir} /> : undefined
          }
        >
          {contenu}
        </ScrollView>
      ) : (
        <View style={[styles.contenu, { flex: 1 }]}>{contenu}</View>
      )}
    </SafeAreaView>
  );
}

export function Bouton({
  libelle,
  onPress,
  variante = 'primaire',
  chargement = false,
  desactive = false,
  style,
}: {
  libelle: string;
  onPress: () => void;
  variante?: 'primaire' | 'secondaire' | 'danger' | 'discret';
  chargement?: boolean;
  desactive?: boolean;
  style?: ViewStyle;
}) {
  const fond = {
    primaire: couleurs.primaire,
    secondaire: couleurs.primaireClair,
    danger: couleurs.sos,
    discret: 'transparent',
  }[variante];
  const texte = variante === 'secondaire' || variante === 'discret' ? couleurs.primaire : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desactive || chargement}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, opacity: desactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {chargement ? <ActivityIndicator color={texte} /> : <Text style={[styles.texteBouton, { color: texte }]}>{libelle}</Text>}
    </Pressable>
  );
}

export function Champ({ libelle, ...props }: TextInputProps & { libelle: string }) {
  return (
    <View style={{ marginBottom: espace.m }}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput placeholderTextColor={couleurs.texteSecondaire} style={styles.champ} {...props} />
    </View>
  );
}

export function Carte({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const contenu = <View style={[styles.carte, style]}>{children}</View>;
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {contenu}
    </Pressable>
  ) : (
    contenu
  );
}

export function Pastille({ libelle, couleur }: { libelle: string; couleur: string }) {
  return (
    <View style={[styles.pastille, { backgroundColor: couleur }]}>
      <Text style={styles.textePastille}>{libelle}</Text>
    </View>
  );
}

export function Message({ texte, type = 'info' }: { texte: string; type?: 'info' | 'erreur' | 'succes' }) {
  const couleur = { info: couleurs.info, erreur: couleurs.erreur, succes: couleurs.succes }[type];
  return (
    <View style={[styles.message, { borderLeftColor: couleur }]}>
      <Text style={{ color: couleurs.texte, fontSize: police.normale }}>{texte}</Text>
    </View>
  );
}

export function Vide({ texte }: { texte: string }) {
  return <Text style={styles.vide}>{texte}</Text>;
}

export function SousTitre({ children }: { children: ReactNode }) {
  return <Text style={styles.sousTitre}>{children}</Text>;
}

export const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espace.m, paddingBottom: espace.xl },
  titreEcran: { fontSize: police.titre, fontWeight: '700', color: couleurs.texte, marginBottom: espace.m },
  sousTitre: {
    fontSize: police.moyenne,
    fontWeight: '600',
    color: couleurs.texte,
    marginTop: espace.l,
    marginBottom: espace.s,
  },
  bouton: {
    minHeight: 50,
    borderRadius: rayon.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espace.m,
    marginVertical: espace.xs,
  },
  texteBouton: { fontSize: police.moyenne, fontWeight: '600' },
  libelle: { fontSize: police.petite, color: couleurs.texteSecondaire, marginBottom: espace.xs },
  champ: {
    backgroundColor: couleurs.surface,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayon.s,
    padding: espace.m,
    fontSize: police.normale,
    color: couleurs.texte,
  },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.m,
    padding: espace.m,
    marginBottom: espace.m,
    borderWidth: 1,
    borderColor: couleurs.bordure,
  },
  pastille: { alignSelf: 'flex-start', borderRadius: rayon.l, paddingHorizontal: espace.s, paddingVertical: 2 },
  textePastille: { color: '#fff', fontSize: police.petite, fontWeight: '600' },
  message: {
    backgroundColor: couleurs.surface,
    borderLeftWidth: 4,
    padding: espace.m,
    borderRadius: rayon.s,
    marginBottom: espace.m,
  },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginVertical: espace.xl },
  texte: { fontSize: police.normale, color: couleurs.texte, lineHeight: 21 },
  texteSecondaire: { fontSize: police.petite, color: couleurs.texteSecondaire },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espace.s },
});
