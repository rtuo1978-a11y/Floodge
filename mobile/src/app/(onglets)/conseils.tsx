import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Bouton, Carte, Ecran, Message, SousTitre, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Conseil, MomentConseil } from '../../lib/types';
import { lire } from '../../lib/voix';
import { couleurs, espace, rayon } from '../../theme';

const MOMENTS: { cle: MomentConseil; libelle: string }[] = [
  { cle: 'AVANT', libelle: 'Avant' },
  { cle: 'PENDANT', libelle: 'Pendant' },
  { cle: 'APRES', libelle: 'Après' },
];

export default function ConseilsEcran() {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [moment, setMoment] = useState<MomentConseil>('AVANT');
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const [situation, setSituation] = useState('');
  const [perso, setPerso] = useState<string[] | null>(null);
  const [chargementPerso, setChargementPerso] = useState(false);

  useEffect(() => {
    api.conseils().then(setConseils).catch((e: Error) => setErreur(e.message));
  }, []);

  async function demanderConseils() {
    setChargementPerso(true);
    try {
      const r = await api.conseilsPersonnalises(situation.trim(), utilisateur?.commune);
      setPerso(r.conseils);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargementPerso(false);
    }
  }

  return (
    <Ecran titre="Conseils">
      {erreur ? <Message type="erreur" texte={erreur} /> : null}

      <View style={[styles.ligne, { marginBottom: espace.m }]}>
        {MOMENTS.map((m) => (
          <Pressable
            key={m.cle}
            onPress={() => setMoment(m.cle)}
            style={{
              flex: 1,
              paddingVertical: espace.s,
              borderRadius: rayon.l,
              alignItems: 'center',
              backgroundColor: moment === m.cle ? couleurs.primaire : couleurs.primaireClair,
            }}
          >
            <Text style={{ color: moment === m.cle ? '#fff' : couleurs.primaire, fontWeight: '600' }}>{m.libelle}</Text>
          </Pressable>
        ))}
      </View>

      {conseils
        .filter((c) => c.moment === moment)
        .map((c) => (
          <Carte key={c.id} onPress={() => lire(`${c.titre}. ${c.contenu}`)}>
            <Text style={[styles.texte, { fontWeight: '700' }]}>{c.titre}</Text>
            <Text style={[styles.texte, { marginTop: espace.xs }]}>{c.contenu}</Text>
          </Carte>
        ))}
      <Text style={styles.texteSecondaire}>Touchez un conseil pour l'écouter.</Text>

      <SousTitre>Conseils pour ma situation</SousTitre>
      <TextInput
        style={[styles.champ, { minHeight: 70, textAlignVertical: 'top' }]}
        multiline
        value={situation}
        onChangeText={setSituation}
        placeholder="Ex. : l'eau entre dans ma cour et j'ai un bébé"
        placeholderTextColor={couleurs.texteSecondaire}
      />
      <Bouton libelle="Demander à l'IA" onPress={demanderConseils} chargement={chargementPerso} desactive={!situation.trim()} />
      {perso ? (
        <Carte style={{ marginTop: espace.s }}>
          {perso.map((c, i) => (
            <Text key={i} style={[styles.texte, { marginBottom: espace.s }]}>
              {i + 1}. {c}
            </Text>
          ))}
          <Bouton libelle="🔊 Écouter" variante="secondaire" onPress={() => lire(perso.join('. '))} />
        </Carte>
      ) : null}

      <Bouton libelle="💬 Discuter avec l'assistant" variante="secondaire" onPress={() => router.push('/assistant')} style={{ marginTop: espace.l }} />
    </Ecran>
  );
}
