import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Message, Pastille, styles, Vide } from '../../components/ui';
import { api } from '../../lib/api';
import { ilYa, NIVEAUX_ALERTE } from '../../lib/format';
import { positionActuelle } from '../../lib/position';
import type { Alerte } from '../../lib/types';
import { arreterLecture, lire, texteAlerte } from '../../lib/voix';
import { espace } from '../../theme';

/** Fréquence de vérification des nouvelles alertes quand l'écran est ouvert (en plus des notifications push). */
const INTERVALLE_MS = 60_000;

export default function AlertesEcran() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enLecture, setEnLecture] = useState<string | null>(null);
  const dejaVues = useRef<Set<string> | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const pos = await positionActuelle();
      const liste = await api.alertes(pos ?? undefined);
      setAlertes(liste);

      // Nouvelle alerte DANGER depuis le dernier chargement → lecture vocale automatique
      if (dejaVues.current) {
        const nouvelle = liste.find((a) => a.niveau === 'DANGER' && !dejaVues.current!.has(a.id));
        if (nouvelle) void lire(texteAlerte(nouvelle));
      }
      dejaVues.current = new Set(liste.map((a) => a.id));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
      const minuterie = setInterval(charger, INTERVALLE_MS);
      return () => clearInterval(minuterie);
    }, [charger]),
  );

  useEffect(() => () => void arreterLecture(), []);

  async function basculerLecture(a: Alerte) {
    if (enLecture === a.id) {
      await arreterLecture();
      setEnLecture(null);
    } else {
      setEnLecture(a.id);
      await lire(texteAlerte(a));
    }
  }

  return (
    <Ecran titre="Alertes" onRafraichir={charger} rafraichissement={chargement}>
      {erreur ? <Message type="erreur" texte={erreur} /> : null}
      {!chargement && !alertes.length && !erreur ? <Vide texte="Aucune alerte en cours. Restez vigilants pendant la saison des pluies." /> : null}

      {alertes.map((a) => (
        <Carte key={a.id} style={{ borderLeftWidth: 5, borderLeftColor: NIVEAUX_ALERTE[a.niveau].couleur }}>
          <View style={[styles.ligne, { justifyContent: 'space-between', marginBottom: espace.s }]}>
            <Pastille libelle={NIVEAUX_ALERTE[a.niveau].libelle} couleur={NIVEAUX_ALERTE[a.niveau].couleur} />
            <Text style={styles.texteSecondaire}>{a.publieeLe ? ilYa(a.publieeLe) : ''}</Text>
          </View>
          <Text style={[styles.texte, { fontWeight: '700', fontSize: 17 }]}>{a.titre}</Text>
          <Text style={[styles.texte, { marginVertical: espace.s }]}>{a.message}</Text>
          <Text style={styles.texteSecondaire}>
            {[a.zone?.nom, a.commune, a.distanceKm != null ? `à ${a.distanceKm} km de vous` : null].filter(Boolean).join(' · ')}
          </Text>
          <Bouton
            variante="secondaire"
            libelle={enLecture === a.id ? '⏹ Arrêter' : '🔊 Écouter l’alerte'}
            onPress={() => basculerLecture(a)}
            style={{ marginTop: espace.s }}
          />
        </Carte>
      ))}
    </Ecran>
  );
}
