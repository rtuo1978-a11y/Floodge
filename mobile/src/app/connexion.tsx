import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Bouton, Champ, Ecran, Message, styles } from '../components/ui';
import { useAuth } from '../lib/auth';
import { couleurs, espace, police } from '../theme';

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
    <Ecran>
      <View style={{ alignItems: 'center', marginVertical: espace.xl }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: couleurs.primaire }}>Floodge</Text>
        <Text style={[styles.texteSecondaire, { fontSize: police.normale }]}>Anticiper, alerter, protéger.</Text>
      </View>

      {erreur ? <Message type="erreur" texte={erreur} /> : null}
      <Champ
        libelle="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="exemple@mail.com"
      />
      <Champ
        libelle="Mot de passe"
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        autoComplete="password"
      />
      <Bouton libelle="Se connecter" onPress={valider} chargement={chargement} desactive={!email || !motDePasse} />

      <Bouton libelle="Créer un compte" variante="discret" onPress={() => router.push('/inscription')} />
    </Ecran>
  );
}
