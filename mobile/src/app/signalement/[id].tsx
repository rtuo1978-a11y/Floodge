import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Message, Pastille, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ilYa, NIVEAUX_INONDATION, NIVEAUX_RISQUE, STATUTS_SIGNALEMENT } from '../../lib/format';
import type { Signalement } from '../../lib/types';
import { couleurs, espace, rayon } from '../../theme';

export default function SignalementEcran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const [s, setS] = useState<Signalement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [action, setAction] = useState(false);

  const charger = useCallback(() => {
    api.signalement(id).then(setS).catch((e: Error) => setErreur(e.message));
  }, [id]);

  useEffect(charger, [charger]);

  async function agir(fn: () => Promise<Signalement>, message: string) {
    setAction(true);
    setErreur(null);
    try {
      setS(await fn());
      setInfo(message);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setAction(false);
    }
  }

  if (!s) return erreur ? <Message type="erreur" texte={erreur} /> : <ActivityIndicator style={{ marginTop: 40 }} />;

  const estAuteur = s.auteur.id === utilisateur?.id;
  const peutVerifier = ['AUTORITE', 'ADMIN', 'SECOURISTE'].includes(utilisateur?.role ?? '');
  const ouvert = s.statut === 'EN_ATTENTE' || s.statut === 'CONFIRME';

  return (
    <Ecran>
      {erreur ? <Message type="erreur" texte={erreur} /> : null}
      {info ? <Message type="succes" texte={info} /> : null}

      <Carte>
        <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
          <Pastille libelle={NIVEAUX_INONDATION[s.niveau].libelle} couleur={NIVEAUX_INONDATION[s.niveau].couleur} />
          <Text style={styles.texteSecondaire}>{ilYa(s.createdAt)}</Text>
        </View>
        <Text style={[styles.texte, { marginVertical: espace.m }]}>{s.description}</Text>
        {s.photoUrl ? (
          <Image source={{ uri: s.photoUrl }} style={{ width: '100%', height: 220, borderRadius: rayon.m, marginBottom: espace.m }} />
        ) : null}
        <Text style={styles.texteSecondaire}>
          {[s.commune, s.zone ? `${s.zone.nom} (${NIVEAUX_RISQUE[s.zone.niveau].libelle})` : null].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.texteSecondaire}>
          Par {s.auteur.nom} · {STATUTS_SIGNALEMENT[s.statut]} · {s._count.confirmations} confirmation(s)
        </Text>
      </Carte>

      {peutVerifier && s.analyseIa ? (
        <Carte style={{ backgroundColor: couleurs.primaireClair }}>
          <Text style={[styles.texte, { fontWeight: '700' }]}>Analyse IA</Text>
          <Text style={styles.texte}>{s.analyseIa.resume}</Text>
          <Text style={styles.texteSecondaire}>
            Gravité estimée : {NIVEAUX_INONDATION[s.analyseIa.graviteEstimee].libelle} · crédibilité{' '}
            {Math.round(s.analyseIa.credibilite * 100)} %{s.analyseIa.besoinSecours ? ' · ⚠️ besoin de secours' : ''}
          </Text>
        </Carte>
      ) : null}

      {!estAuteur && ouvert ? (
        <Bouton
          libelle="👀 Je vois aussi l'eau ici"
          variante="secondaire"
          chargement={action}
          onPress={() => agir(() => api.confirmer(s.id), 'Merci, votre confirmation aide les secours (+2 points).')}
        />
      ) : null}

      {peutVerifier && s.statut === 'EN_ATTENTE' ? (
        <View style={[styles.ligne, { marginTop: espace.m }]}>
          <Bouton
            libelle="Confirmer"
            style={{ flex: 1 }}
            onPress={() => agir(() => api.changerStatutSignalement(s.id, 'CONFIRME'), 'Signalement confirmé.')}
          />
          <Bouton
            libelle="Rejeter"
            variante="danger"
            style={{ flex: 1 }}
            onPress={() => agir(() => api.changerStatutSignalement(s.id, 'REJETE'), 'Signalement rejeté.')}
          />
        </View>
      ) : null}
      {peutVerifier && s.statut === 'CONFIRME' ? (
        <Bouton
          libelle="Marquer comme résolu (l'eau a baissé)"
          variante="secondaire"
          onPress={() => agir(() => api.changerStatutSignalement(s.id, 'RESOLU'), 'Signalement résolu.')}
        />
      ) : null}
    </Ecran>
  );
}
