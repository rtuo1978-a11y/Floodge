import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Message, Pastille, SousTitre, styles, Vide } from '../components/ui';
import { api } from '../lib/api';
import { ilYa, NIVEAUX_ALERTE, NIVEAUX_INONDATION } from '../lib/format';
import type { Alerte, Signalement } from '../lib/types';
import { espace } from '../theme';

/** Espace autorités : valider les alertes proposées et vérifier les signalements. */
export default function AutoriteEcran() {
  const router = useRouter();
  const [brouillons, setBrouillons] = useState<Alerte[]>([]);
  const [enAttente, setEnAttente] = useState<Signalement[]>([]);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<{ texte: string; type: 'succes' | 'erreur' } | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [b, s] = await Promise.all([api.brouillons(), api.signalements({ statut: 'EN_ATTENTE', heures: 72 })]);
      setBrouillons(b);
      setEnAttente(s);
    } catch (e) {
      setMessage({ texte: (e as Error).message, type: 'erreur' });
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  async function publier(a: Alerte) {
    try {
      const r = await api.publierAlerte(a.id);
      setMessage({ texte: `Alerte publiée et envoyée à ${r.destinataires} téléphone(s).`, type: 'succes' });
      await charger();
    } catch (e) {
      setMessage({ texte: (e as Error).message, type: 'erreur' });
    }
  }

  async function archiver(a: Alerte) {
    await api.archiverAlerte(a.id).catch(() => null);
    await charger();
  }

  return (
    <Ecran onRafraichir={charger} rafraichissement={chargement}>
      {message ? <Message type={message.type} texte={message.texte} /> : null}

      <SousTitre>Alertes à valider ({brouillons.length})</SousTitre>
      {brouillons.length ? null : <Vide texte="Aucune alerte en attente." />}
      {brouillons.map((a) => (
        <Carte key={a.id}>
          <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
            <Pastille libelle={NIVEAUX_ALERTE[a.niveau].libelle} couleur={NIVEAUX_ALERTE[a.niveau].couleur} />
            <Text style={styles.texteSecondaire}>
              {a.origine === 'AUTOMATIQUE' ? '🤖 proposée automatiquement · ' : ''}
              {ilYa(a.createdAt)}
            </Text>
          </View>
          <Text style={[styles.texte, { fontWeight: '700', marginTop: espace.s }]}>{a.titre}</Text>
          <Text style={styles.texte}>{a.message}</Text>
          <View style={[styles.ligne, { marginTop: espace.s }]}>
            <Bouton libelle="Publier" onPress={() => publier(a)} style={{ flex: 1 }} />
            <Bouton libelle="Écarter" variante="secondaire" onPress={() => archiver(a)} style={{ flex: 1 }} />
          </View>
        </Carte>
      ))}

      <SousTitre>Signalements à vérifier ({enAttente.length})</SousTitre>
      {enAttente.length ? null : <Vide texte="Aucun signalement en attente." />}
      {enAttente.map((s) => (
        <Carte key={s.id} onPress={() => router.push(`/signalement/${s.id}`)}>
          <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
            <Pastille libelle={NIVEAUX_INONDATION[s.niveau].libelle} couleur={NIVEAUX_INONDATION[s.niveau].couleur} />
            <Text style={styles.texteSecondaire}>{ilYa(s.createdAt)}</Text>
          </View>
          <Text style={[styles.texte, { marginTop: espace.s }]} numberOfLines={2}>
            {s.description}
          </Text>
          <Text style={styles.texteSecondaire}>
            {s.commune ?? 'Commune inconnue'} · {s._count.confirmations} confirmation(s)
            {s.analyseIa?.besoinSecours ? ' · ⚠️ secours' : ''}
          </Text>
        </Carte>
      ))}
    </Ecran>
  );
}
