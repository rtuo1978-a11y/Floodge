import { useFocusEffect } from 'expo-router';
import { BellOff, Clock, MapPin, Pause, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Apparition } from '../../components/anim';
import { Bandeau, Bouton, Carte, Ecran, EtatVide, PastilleNiveau, Segments, Squelette, styles, Texte } from '../../components/ui';
import { haptique } from '../../lib/haptique';
import { api } from '../../lib/api';
import { distance, ilYa, NIVEAUX_ALERTE } from '../../lib/format';
import { positionActuelle } from '../../lib/position';
import type { Alerte, NiveauAlerte } from '../../lib/types';
import { arreterLecture, lire, texteAlerte } from '../../lib/voix';
import { couleurs, espace } from '../../theme';

/** Fréquence de vérification des nouvelles alertes quand l'écran est ouvert (en plus des notifications push). */
const INTERVALLE_MS = 60_000;

export default function AlertesEcran() {
  const [alertes, setAlertes] = useState<Alerte[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enLecture, setEnLecture] = useState<string | null>(null);
  const dejaVues = useRef<Set<string> | null>(null);
  const [filtre, setFiltre] = useState<'TOUTES' | NiveauAlerte>('TOUTES');

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
    haptique.selection();
    if (enLecture === a.id) {
      await arreterLecture();
      setEnLecture(null);
    } else {
      setEnLecture(a.id);
      await lire(texteAlerte(a));
    }
  }

  const nbDanger = alertes?.filter((a) => a.niveau === 'DANGER').length ?? 0;
  const compte = (n: NiveauAlerte) => alertes?.filter((a) => a.niveau === n).length ?? 0;
  const visibles = alertes?.filter((a) => filtre === 'TOUTES' || a.niveau === filtre);

  return (
    <Ecran
      titre="Alertes"
      sousTitre={
        alertes
          ? alertes.length
            ? `${alertes.length} en cours${nbDanger ? ` · ${nbDanger} danger` : ''}`
            : 'Aucune alerte en cours'
          : 'Chargement…'
      }
      onRafraichir={charger}
      rafraichissement={chargement && !!alertes}
    >
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}
      {alertes?.length ? (
        <View style={{ marginBottom: espace.m }}>
          <Segments
            options={[
              { cle: 'TOUTES' as const, libelle: 'Toutes' },
              { cle: 'DANGER' as const, libelle: `Danger${compte('DANGER') ? ' ' + compte('DANGER') : ''}` },
              { cle: 'VIGILANCE' as const, libelle: 'Vigilance' },
              { cle: 'INFO' as const, libelle: 'Info' },
            ]}
            valeur={filtre}
            onChange={(v) => {
              haptique.selection();
              setFiltre(v);
            }}
          />
        </View>
      ) : null}
      {!alertes && !erreur ? (
        <>
          <Squelette hauteur={180} />
          <Squelette hauteur={150} />
        </>
      ) : null}
      {alertes && !alertes.length ? (
        <EtatVide
          icone={BellOff}
          titre="Tout est calme"
          texte="Aucune alerte en cours près de vous. Vous serez prévenu immédiatement, même téléphone verrouillé."
        />
      ) : null}

      {alertes?.length && !visibles?.length ? <EtatVide icone={BellOff} titre="Aucune alerte de ce niveau" /> : null}

      {visibles?.map((a, i) => {
        const n = NIVEAUX_ALERTE[a.niveau];
        const lecture = enLecture === a.id;
        return (
          <Apparition key={a.id} index={i}>
            <Carte accent={n.couleur} style={{ paddingLeft: espace.m }}>
              <View style={styles.entre}>
                <PastilleNiveau s={n} />
                <View style={styles.ligne}>
                  <Clock size={14} color={couleurs.texteSecondaire} />
                  <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                    {a.publieeLe ? ilYa(a.publieeLe) : ''}
                  </Texte>
                </View>
              </View>
              <Texte variante="titre3" style={{ marginTop: espace.sm }}>
                {a.titre}
              </Texte>
              <Texte variante="corps" style={{ marginTop: espace.xs }}>
                {a.message}
              </Texte>
              {a.zone || a.commune || a.distanceKm != null ? (
                <View style={[styles.ligne, { marginTop: espace.sm }]}>
                  <MapPin size={16} color={couleurs.texteSecondaire} />
                  <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ flex: 1 }}>
                    {[a.zone?.nom, a.commune, distance(a.distanceKm)].filter(Boolean).join(' · ')}
                  </Texte>
                </View>
              ) : null}
              <Bouton
                variante={lecture ? 'primaire' : 'secondaire'}
                icone={lecture ? Pause : Volume2}
                libelle={lecture ? 'Arrêter la lecture' : 'Écouter l’alerte'}
                onPress={() => basculerLecture(a)}
                petit
                style={{ marginTop: espace.sm }}
              />
            </Carte>
          </Apparition>
        );
      })}
    </Ecran>
  );
}
