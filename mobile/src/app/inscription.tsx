import { Lock, Mail, MapPin, Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { Bandeau, Bouton, Champ, Ecran, Texte } from '../components/ui';
import { useAuth } from '../lib/auth';
import { couleurs, espace } from '../theme';

export default function Inscription() {
  const { inscrire } = useAuth();
  const [f, setF] = useState({ nom: '', email: '', telephone: '', commune: '', motDePasse: '' });
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const maj = (cle: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [cle]: v }));
  const mdpTropCourt = f.motDePasse.length > 0 && f.motDePasse.length < 8;

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
    <Ecran enTeteSysteme>
      <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginBottom: espace.l }}>
        Votre commune permet de vous envoyer les alertes de votre quartier. Votre téléphone n'est partagé qu'avec les secours, si vous
        demandez de l'aide.
      </Texte>
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}
      <Champ libelle="Nom complet" icone={User} value={f.nom} onChangeText={maj('nom')} autoComplete="name" />
      <Champ
        libelle="Adresse e-mail"
        icone={Mail}
        value={f.email}
        onChangeText={maj('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Champ
        libelle="Téléphone (facultatif)"
        aide="Pour que les secours puissent vous rappeler"
        icone={Phone}
        value={f.telephone}
        onChangeText={maj('telephone')}
        keyboardType="phone-pad"
      />
      <Champ libelle="Commune" aide="Ex. : Cocody, Yopougon, Abobo…" icone={MapPin} value={f.commune} onChangeText={maj('commune')} />
      <Champ
        libelle="Mot de passe"
        icone={Lock}
        value={f.motDePasse}
        onChangeText={maj('motDePasse')}
        secureTextEntry
        autoComplete="new-password"
        aide="8 caractères minimum"
        erreur={mdpTropCourt ? 'Encore ' + (8 - f.motDePasse.length) + ' caractère(s)' : null}
      />
      <Bouton
        libelle="Créer mon compte"
        onPress={valider}
        chargement={chargement}
        desactive={!f.nom || !f.email || f.motDePasse.length < 8}
      />
    </Ecran>
  );
}
