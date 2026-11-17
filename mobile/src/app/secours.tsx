import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Message, Pastille, styles, Vide } from '../components/ui';
import { api } from '../lib/api';
import { ilYa, STATUTS_SECOURS } from '../lib/format';
import type { DemandeSecours, StatutSecours } from '../lib/types';
import { couleurs, espace } from '../theme';

/** Espace secours : demandes SOS en cours, prise en charge, guidage. */
export default function SecoursEcran() {
  const [demandes, setDemandes] = useState<DemandeSecours[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setDemandes(await api.demandesSecours());
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
      const minuterie = setInterval(charger, 30_000);
      return () => clearInterval(minuterie);
    }, [charger]),
  );

  async function changer(d: DemandeSecours, statut: StatutSecours) {
    try {
      await api.majSecours(d.id, statut);
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  const itineraire = (d: DemandeSecours) =>
    Linking.openURL(
      Platform.OS === 'ios'
        ? `maps://?daddr=${d.latitude},${d.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`,
    );

  return (
    <Ecran onRafraichir={charger} rafraichissement={chargement}>
      {erreur ? <Message type="erreur" texte={erreur} /> : null}
      {!demandes.length && !chargement ? <Vide texte="Aucune demande de secours en cours." /> : null}

      {demandes.map((d) => (
        <Carte key={d.id} style={{ borderLeftWidth: 5, borderLeftColor: d.statut === 'EN_ATTENTE' ? couleurs.sos : couleurs.modere }}>
          <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
            <Pastille
              libelle={STATUTS_SECOURS[d.statut]}
              couleur={d.statut === 'EN_ATTENTE' ? couleurs.sos : couleurs.modere}
            />
            <Text style={styles.texteSecondaire}>{ilYa(d.createdAt)}</Text>
          </View>
          <Text style={[styles.texte, { fontWeight: '700', marginTop: espace.s }]}>
            {d.nbPersonnes} personne(s) — {d.demandeur?.nom ?? 'Citoyen'}
          </Text>
          {d.description ? <Text style={styles.texte}>{d.description}</Text> : null}
          {d.secouriste ? <Text style={styles.texteSecondaire}>Pris en charge par {d.secouriste.nom}</Text> : null}

          <View style={[styles.ligne, { marginTop: espace.s, flexWrap: 'wrap' }]}>
            <Bouton libelle="🧭 Y aller" variante="secondaire" onPress={() => itineraire(d)} style={{ flex: 1 }} />
            {d.telephone || d.demandeur?.telephone ? (
              <Bouton
                libelle="📞 Appeler"
                variante="secondaire"
                onPress={() => Linking.openURL(`tel:${d.telephone ?? d.demandeur?.telephone}`)}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
          {d.statut === 'EN_ATTENTE' ? (
            <Bouton libelle="Prendre en charge" onPress={() => changer(d, 'PRISE_EN_CHARGE')} />
          ) : (
            <Bouton libelle="Intervention terminée" onPress={() => changer(d, 'TERMINEE')} />
          )}
        </Carte>
      ))}
    </Ecran>
  );
}
