import { useState } from 'react';
import { Bouton, Champ, Ecran, Message } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Inscription() {
  const { inscrire } = useAuth();
  const [f, setF] = useState({ nom: '', email: '', telephone: '', commune: '', motDePasse: '' });
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const maj = (cle: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [cle]: v }));

  async function valider() {
    setErreur(null);
    setChargement(true);
    try {
      await inscrire({
        nom: f.nom.trim(),
        email: f.email.trim(),
        motDePasse: f.motDePasse,
        telephone: f.telephone.trim() || undefined,
        commune: f.commune.trim() || undefined,
      });
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <Ecran>
      {erreur ? <Message type="erreur" texte={erreur} /> : null}
      <Champ libelle="Nom complet" value={f.nom} onChangeText={maj('nom')} autoComplete="name" />
      <Champ libelle="E-mail" value={f.email} onChangeText={maj('email')} autoCapitalize="none" keyboardType="email-address" />
      <Champ libelle="Téléphone (pour être joint par les secours)" value={f.telephone} onChangeText={maj('telephone')} keyboardType="phone-pad" />
      <Champ libelle="Commune (ex. Cocody, Yopougon…)" value={f.commune} onChangeText={maj('commune')} />
      <Champ libelle="Mot de passe (8 caractères minimum)" value={f.motDePasse} onChangeText={maj('motDePasse')} secureTextEntry />
      <Bouton
        libelle="Créer mon compte"
        onPress={valider}
        chargement={chargement}
        desactive={!f.nom || !f.email || f.motDePasse.length < 8}
      />
    </Ecran>
  );
}
