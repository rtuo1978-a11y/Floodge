import { useFocusEffect } from 'expo-router';
import { CircleCheck, Clock, LifeBuoy, Navigation, Phone, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Bandeau, Bouton, Carte, Ecran, EtatVide, PastilleNiveau, Squelette, styles as ui, Texte } from '../components/ui';
import { api } from '../lib/api';
import { ilYa, STATUTS_SECOURS } from '../lib/format';
import type { DemandeSecours, StatutSecours } from '../lib/types';
import { couleurs, espace } from '../theme';

/** Espace secours : demandes SOS en cours, prise en charge, guidage. */
export default function SecoursEcran() {
  const [demandes, setDemandes] = useState<DemandeSecours[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

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
    setEnCours(d.id);
    try {
      await api.majSecours(d.id, statut);
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(null);
    }
  }

  const itineraire = (d: DemandeSecours) =>
    Linking.openURL(
      Platform.OS === 'ios'
        ? `maps://?daddr=${d.latitude},${d.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`,
    );

  const enAttente = demandes?.filter((d) => d.statut === 'EN_ATTENTE').length ?? 0;

  return (
    <Ecran enTeteSysteme onRafraichir={charger} rafraichissement={chargement && !!demandes}>
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}
      {demandes?.length ? (
        <Bandeau
          type={enAttente ? 'erreur' : 'info'}
          icone={LifeBuoy}
          titre={enAttente ? `${enAttente} demande(s) sans équipe` : 'Toutes les demandes sont prises en charge'}
          texte="Mise à jour automatique toutes les 30 secondes."
        />
      ) : null}
      {!demandes && !erreur ? (
        <>
          <Squelette hauteur={200} />
          <Squelette hauteur={200} />
        </>
      ) : null}
      {demandes && !demandes.length ? (
        <EtatVide icone={LifeBuoy} titre="Aucune demande en cours" texte="Les nouvelles demandes SOS apparaîtront ici et sur vos notifications." />
      ) : null}

      {demandes?.map((d) => {
        const st = STATUTS_SECOURS[d.statut];
        const tel = d.telephone ?? d.demandeur?.telephone;
        return (
          <Carte key={d.id} accent={st.couleur}>
            <View style={ui.entre}>
              <PastilleNiveau s={st} />
              <View style={ui.ligne}>
                <Clock size={14} color={couleurs.texteSecondaire} />
                <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                  {ilYa(d.createdAt)}
                </Texte>
              </View>
            </View>
            <View style={[ui.ligne, { marginTop: espace.sm }]}>
              <Users size={20} color={couleurs.texte} />
              <Texte variante="titre3">
                {d.nbPersonnes} personne{d.nbPersonnes > 1 ? 's' : ''} — {d.demandeur?.nom ?? 'Citoyen'}
              </Texte>
            </View>
            {d.description ? (
              <Texte variante="corps" style={{ marginTop: espace.xs }}>
                {d.description}
              </Texte>
            ) : null}
            {d.secouriste ? (
              <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ marginTop: espace.xs }}>
                Équipe : {d.secouriste.nom}
              </Texte>
            ) : null}

            <View style={[ui.ligne, { marginTop: espace.sm }]}>
              <Bouton libelle="Itinéraire" icone={Navigation} variante="contour" petit onPress={() => itineraire(d)} style={{ flex: 1 }} />
              {tel ? (
                <Bouton libelle="Appeler" icone={Phone} variante="contour" petit onPress={() => Linking.openURL(`tel:${tel}`)} style={{ flex: 1 }} />
              ) : null}
            </View>
            {d.statut === 'EN_ATTENTE' ? (
              <Bouton libelle="Prendre en charge" icone={LifeBuoy} variante="danger" chargement={enCours === d.id} onPress={() => changer(d, 'PRISE_EN_CHARGE')} />
            ) : (
              <Bouton libelle="Intervention terminée" icone={CircleCheck} chargement={enCours === d.id} onPress={() => changer(d, 'TERMINEE')} />
            )}
          </Carte>
        );
      })}
    </Ecran>
  );
}
