import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Logo } from '../components/Logo';
import { Bandeau, Bouton, Champ, Texte } from '../components/ui';
import { useAuth } from '../lib/auth';
import { couleurs, espace, ombre, rayon } from '../theme';

export default function Connexion() {
  const { connecter } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function valider() {
    setErreur(null);
    setChargement(true);
    try {
      await connecter(email.trim(), motDePasse);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: couleurs.fond }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* En-tête de marque */}
        <View style={styles.hero}>
          <SafeAreaView edges={['top']} style={{ alignItems: 'center' }}>
            <Logo taille={72} inverse />
            <Texte variante="affiche" couleur={couleurs.surFonce} style={{ marginTop: espace.m }}>
              Floodge
            </Texte>
            <Texte variante="corps" couleur={couleurs.primaireDoux} style={{ marginTop: espace.xs }}>
              Anticiper, alerter, protéger.
            </Texte>
          </SafeAreaView>
          <Svg width="100%" height={40} viewBox="0 0 400 40" preserveAspectRatio="none" style={styles.vague}>
            <Path d="M0 20 C 70 0, 130 40, 200 20 S 330 0, 400 20 L 400 40 L 0 40 Z" fill={couleurs.fond} />
          </Svg>
        </View>

        <View style={styles.formulaire}>
          <Texte variante="titre2" style={{ marginBottom: espace.xs }}>
            Connexion
          </Texte>
          <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginBottom: espace.l }}>
            Recevez les alertes de votre quartier et aidez vos voisins en signalant les inondations.
          </Texte>

          {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}
          <Champ
            libelle="Adresse e-mail"
            icone={Mail}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="exemple@mail.com"
          />
          <Champ
            libelle="Mot de passe"
            icone={Lock}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={valider}
          />
          <Bouton libelle="Se connecter" onPress={valider} chargement={chargement} desactive={!email || !motDePasse} />

          <View style={styles.separateur}>
            <View style={styles.trait} />
            <Texte variante="petit" couleur={couleurs.texteSecondaire}>
              Nouveau sur Floodge ?
            </Texte>
            <View style={styles.trait} />
          </View>
          <Bouton libelle="Créer un compte" variante="contour" onPress={() => router.push('/inscription')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: couleurs.primaire, paddingTop: espace.xl, paddingBottom: espace.xxl + espace.l, alignItems: 'center' },
  vague: { position: 'absolute', bottom: -1, left: 0, right: 0 },
  formulaire: {
    marginHorizontal: espace.m,
    marginTop: -espace.xl,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.xl,
    padding: espace.l,
    marginBottom: espace.xl,
    ...ombre.moyenne,
  },
  separateur: { flexDirection: 'row', alignItems: 'center', gap: espace.sm, marginVertical: espace.m },
  trait: { flex: 1, height: 1, backgroundColor: couleurs.bordure },
});
