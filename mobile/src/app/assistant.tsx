import { Send, Sparkles, Volume2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Texte } from '../components/ui';
import { api } from '../lib/api';
import { lire } from '../lib/voix';
import { couleurs, espace, rayon, taille, typo } from '../theme';

type Msg = { role: 'user' | 'assistant'; content: string };

const ACCUEIL: Msg = {
  role: 'assistant',
  content:
    "Bonjour, je suis l'assistant Floodge. Posez-moi vos questions sur les inondations : quoi faire, comment se préparer, comment utiliser l'application. En cas de danger, appelez le 180.",
};

const SUGGESTIONS = ["L'eau monte devant chez moi, je fais quoi ?", 'Comment préparer un sac d’urgence ?', 'Comment gagner le badge Meilleur citoyen ?'];

export default function AssistantEcran() {
  const [messages, setMessages] = useState<Msg[]>([ACCUEIL]);
  const [texte, setTexte] = useState('');
  const [attente, setAttente] = useState(false);
  const liste = useRef<FlatList<Msg>>(null);

  async function envoyer(question = texte.trim()) {
    if (!question || attente) return;
    const conversation = [...messages, { role: 'user' as const, content: question }];
    setMessages(conversation);
    setTexte('');
    setAttente(true);
    try {
      // On n'envoie pas le message d'accueil, et au plus les 10 derniers messages
      const r = await api.discuter(conversation.slice(1).slice(-10));
      setMessages((m) => [...m, { role: 'assistant', content: r.reponse }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Erreur : ${(e as Error).message}` }]);
    } finally {
      setAttente(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: couleurs.fond }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={liste}
          data={attente ? [...messages, { role: 'assistant', content: '…' } satisfies Msg] : messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: espace.m, gap: espace.sm }}
          onContentSizeChange={() => liste.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const moi = item.role === 'user';
            return (
              <View style={[styles.rangee, { justifyContent: moi ? 'flex-end' : 'flex-start' }]}>
                {!moi ? (
                  <View style={styles.avatarIa}>
                    <Sparkles size={16} color={couleurs.surPrimaire} />
                  </View>
                ) : null}
                <View style={[styles.bulle, moi ? styles.bulleMoi : styles.bulleIa]}>
                  <Texte variante="corps" couleur={moi ? couleurs.surPrimaire : couleurs.texte}>
                    {item.content}
                  </Texte>
                  {!moi && item.content !== '…' ? (
                    <Pressable
                      onPress={() => lire(item.content)}
                      accessibilityRole="button"
                      accessibilityLabel="Écouter la réponse"
                      hitSlop={10}
                      style={styles.ecouter}
                    >
                      <Volume2 size={16} color={couleurs.primaire} />
                      <Texte variante="legende" couleur={couleurs.primaire}>
                        ÉCOUTER
                      </Texte>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            messages.length === 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.s, paddingTop: espace.s }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => envoyer(s)} style={({ pressed }) => [styles.suggestion, pressed ? { backgroundColor: couleurs.primaireDoux } : null]}>
                    <Texte variante="petitGras" couleur={couleurs.primaire}>
                      {s}
                    </Texte>
                  </Pressable>
                ))}
              </ScrollView>
            ) : undefined
          }
        />
        <View style={styles.saisie}>
          <TextInput
            style={[typo.corps, styles.champ, Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle) : null]}
            value={texte}
            onChangeText={setTexte}
            placeholder="Votre question…"
            placeholderTextColor={couleurs.texteDesactive}
            accessibilityLabel="Votre question"
            onSubmitEditing={() => envoyer()}
            returnKeyType="send"
            multiline
          />
          <Pressable
            onPress={() => envoyer()}
            disabled={!texte.trim() || attente}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            style={({ pressed }) => [
              styles.envoyer,
              { backgroundColor: !texte.trim() ? couleurs.bordureForte : pressed ? couleurs.primairePresse : couleurs.primaire },
            ]}
          >
            <Send size={20} color={couleurs.surPrimaire} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', alignItems: 'flex-end', gap: espace.s },
  avatarIa: { width: 32, height: 32, borderRadius: 16, backgroundColor: couleurs.primaire, alignItems: 'center', justifyContent: 'center' },
  bulle: { maxWidth: '82%', borderRadius: rayon.l, paddingHorizontal: espace.m, paddingVertical: espace.sm },
  bulleMoi: { backgroundColor: couleurs.primaire, borderBottomRightRadius: rayon.s / 2 },
  bulleIa: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderBottomLeftRadius: rayon.s / 2 },
  ecouter: { flexDirection: 'row', alignItems: 'center', gap: espace.xs, marginTop: espace.s },
  suggestion: {
    borderWidth: 1.5,
    borderColor: couleurs.primaireDoux,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.rond,
    paddingHorizontal: espace.m,
    paddingVertical: espace.s,
    minHeight: 44,
    justifyContent: 'center',
  },
  saisie: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espace.s,
    padding: espace.sm,
    backgroundColor: couleurs.surface,
    borderTopWidth: 1,
    borderTopColor: couleurs.bordure,
  },
  champ: {
    flex: 1,
    color: couleurs.texte,
    backgroundColor: couleurs.surfaceAlt,
    borderRadius: rayon.xl,
    paddingHorizontal: espace.m,
    paddingVertical: espace.sm,
    maxHeight: 120,
  },
  envoyer: { width: taille.cible, height: taille.cible, borderRadius: taille.cible / 2, alignItems: 'center', justifyContent: 'center' },
});
