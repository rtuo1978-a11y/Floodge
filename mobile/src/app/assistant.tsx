import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../components/ui';
import { api } from '../lib/api';
import { lire } from '../lib/voix';
import { couleurs, espace, rayon } from '../theme';

type Msg = { role: 'user' | 'assistant'; content: string };

const ACCUEIL: Msg = {
  role: 'assistant',
  content:
    "Bonjour, je suis l'assistant Floodge. Posez-moi vos questions sur les inondations : quoi faire, comment se préparer, comment utiliser l'application. En cas de danger, appelez le 180.",
};

export default function AssistantEcran() {
  const [messages, setMessages] = useState<Msg[]>([ACCUEIL]);
  const [texte, setTexte] = useState('');
  const [attente, setAttente] = useState(false);
  const liste = useRef<FlatList<Msg>>(null);

  async function envoyer() {
    const question = texte.trim();
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
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setAttente(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: couleurs.fond }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={liste}
        data={attente ? [...messages, { role: 'assistant', content: '…' } satisfies Msg] : messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: espace.m }}
        onContentSizeChange={() => liste.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const moi = item.role === 'user';
          return (
            <Pressable
              onLongPress={() => !moi && lire(item.content)}
              style={{
                alignSelf: moi ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: moi ? couleurs.primaire : couleurs.surface,
                borderRadius: rayon.m,
                padding: espace.m,
                marginBottom: espace.s,
              }}
            >
              <Text style={[styles.texte, { color: moi ? '#fff' : couleurs.texte }]}>{item.content}</Text>
            </Pressable>
          );
        }}
      />
      <Text style={[styles.texteSecondaire, { textAlign: 'center' }]}>Appui long sur une réponse pour l'écouter</Text>
      <View style={[styles.ligne, { padding: espace.m }]}>
        <TextInput
          style={[styles.champ, { flex: 1 }]}
          value={texte}
          onChangeText={setTexte}
          placeholder="Votre question…"
          placeholderTextColor={couleurs.texteSecondaire}
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />
        <Pressable
          onPress={envoyer}
          style={{ backgroundColor: couleurs.primaire, borderRadius: rayon.m, paddingHorizontal: espace.m, paddingVertical: 14 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Envoyer</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
