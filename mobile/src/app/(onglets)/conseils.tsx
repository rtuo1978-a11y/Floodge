import { useRouter } from 'expo-router';
import { ChevronRight, CloudRain, House, MessageCircle, Sparkles, Volume2, WavesHorizontal, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Apparition } from '../../components/anim';
import { haptique } from '../../lib/haptique';
import { Bandeau, Bouton, Carte, Champ, Ecran, EnTeteSection, Segments, Squelette, Texte } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Conseil, MomentConseil } from '../../lib/types';
import { lire } from '../../lib/voix';
import { couleurs, espace, ombre, rayon } from '../../theme';

const MOMENTS: { cle: MomentConseil; libelle: string; intro: string; icone: LucideIcon }[] = [
  { cle: 'AVANT', libelle: 'Avant', intro: 'Préparez-vous pendant la saison des pluies.', icone: CloudRain },
  { cle: 'PENDANT', libelle: 'Pendant', intro: "L'eau monte : les bons réflexes pour rester en sécurité.", icone: WavesHorizontal },
  { cle: 'APRES', libelle: 'Après', intro: "L'eau baisse : revenir chez soi sans danger.", icone: House },
];

export default function ConseilsEcran() {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [moment, setMoment] = useState<MomentConseil>('AVANT');
  const [conseils, setConseils] = useState<Conseil[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const [situation, setSituation] = useState('');
  const [perso, setPerso] = useState<string[] | null>(null);
  const [chargementPerso, setChargementPerso] = useState(false);

  useEffect(() => {
    api
      .conseils()
      .then(setConseils)
      .catch((e: Error) => setErreur(e.message));
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

  const m = MOMENTS.find((x) => x.cle === moment)!;
  const liste = conseils?.filter((c) => c.moment === moment) ?? [];

  return (
    <Ecran titre="Conseils" sousTitre="Les bons réflexes face aux inondations">
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}

      <Segments
        options={MOMENTS}
        valeur={moment}
        onChange={(m) => {
          haptique.selection();
          setMoment(m);
        }}
      />
      <View style={[styles.intro]}>
        <m.icone size={20} color={couleurs.primaire} />
        <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ flex: 1 }}>
          {m.intro}
        </Texte>
      </View>

      {!conseils && !erreur ? [0, 1, 2].map((i) => <Squelette key={i} hauteur={88} />) : null}
      {liste.map((c, i) => (
        <Apparition key={`${moment}-${c.id}`} index={i}>
          <Carte onPress={() => lire(`${c.titre}. ${c.contenu}`)} accessibilityLabel={`${c.titre}. ${c.contenu}. Toucher pour écouter`}>
            <View style={styles.conseil}>
              <View style={styles.numero}>
                <Texte variante="petitGras" couleur={couleurs.primaireFonce}>
                  {i + 1}
                </Texte>
              </View>
              <View style={{ flex: 1 }}>
                <Texte variante="corpsGras">{c.titre}</Texte>
                <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginTop: espace.xxs }}>
                  {c.contenu}
                </Texte>
              </View>
              <Volume2 size={18} color={couleurs.primaire} />
            </View>
          </Carte>
        </Apparition>
      ))}

      {/* Conseils personnalisés par l'IA */}
      <View style={[styles.ia, ombre.moyenne]}>
        <View style={[styles.conseil, { marginBottom: espace.m }]}>
          <View style={styles.iconeIa}>
            <Sparkles size={20} color={couleurs.surPrimaire} />
          </View>
          <View style={{ flex: 1 }}>
            <Texte variante="titre3" couleur={couleurs.surFonce}>
              Conseils pour ma situation
            </Texte>
            <Texte variante="petit" couleur={couleurs.primaireDoux}>
              Décrivez ce que vous vivez, l'IA FlowManage vous répond.
            </Texte>
          </View>
        </View>
        <View style={styles.zoneSaisie}>
          <Champ
            libelle="Ma situation"
            multiline
            value={situation}
            onChangeText={setSituation}
            placeholder="Ex. : l'eau entre dans ma cour et j'ai un bébé"
          />
          <Bouton
            libelle="Obtenir des conseils"
            icone={Sparkles}
            onPress={demanderConseils}
            chargement={chargementPerso}
            desactive={!situation.trim()}
          />
        </View>
      </View>

      {perso ? (
        <Carte style={{ marginTop: espace.sm }}>
          {perso.map((c, i) => (
            <View key={i} style={[styles.conseil, { marginBottom: espace.sm }]}>
              <View style={styles.numero}>
                <Texte variante="petitGras" couleur={couleurs.primaireFonce}>
                  {i + 1}
                </Texte>
              </View>
              <Texte variante="corps" style={{ flex: 1 }}>
                {c}
              </Texte>
            </View>
          ))}
          <Bouton libelle="Écouter" icone={Volume2} variante="secondaire" petit onPress={() => lire(perso.join('. '))} />
        </Carte>
      ) : null}

      <EnTeteSection titre="Une question ?" />
      <Pressable
        onPress={() => router.push('/assistant')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.lienAssistant, { backgroundColor: pressed ? couleurs.primaireTresDoux : couleurs.surface }]}
      >
        <View style={styles.iconeAssistant}>
          <MessageCircle size={22} color={couleurs.primaire} />
        </View>
        <View style={{ flex: 1 }}>
          <Texte variante="corpsGras">Discuter avec l'assistant</Texte>
          <Texte variante="petit" couleur={couleurs.texteSecondaire}>
            Questions sur les inondations et l'application
          </Texte>
        </View>
        <ChevronRight size={20} color={couleurs.texteSecondaire} />
      </Pressable>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center', gap: espace.s, marginVertical: espace.m },
  conseil: { flexDirection: 'row', alignItems: 'flex-start', gap: espace.sm },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: couleurs.primaireDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ia: { backgroundColor: couleurs.primaire, borderRadius: rayon.xl, padding: espace.m, marginTop: espace.l },
  iconeIa: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: couleurs.voileClairFort,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneSaisie: { backgroundColor: couleurs.surface, borderRadius: rayon.l, padding: espace.m },
  lienAssistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    borderRadius: rayon.l,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espace.m,
  },
  iconeAssistant: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: couleurs.primaireDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
