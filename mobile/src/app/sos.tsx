import { Ambulance, Hourglass, Phone, ShieldCheck, Siren } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Bandeau, Bouton, Carte, Champ, Ecran, EnTeteSection, Texte } from '../components/ui';
import { haptique } from '../lib/haptique';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ilYa } from '../lib/format';
import { positionActuelle } from '../lib/position';
import type { DemandeSecours } from '../lib/types';
import { couleurs, espace, ombre, rayon, taille } from '../theme';

/** Durée d'appui nécessaire : évite les déclenchements par erreur (poche, enfant…). */
const DUREE_MAINTIEN_MS = 1500;

const NUMEROS = [
  { libelle: 'Sapeurs-pompiers', numero: '180' },
  { libelle: 'SAMU', numero: '185' },
  { libelle: 'Police', numero: '110' },
];

/** Halo autour du bouton SOS (désactivé si « réduire les animations » est activé). */
function Halo() {
  const echelle = useRef(new Animated.Value(1)).current;
  const [reduit, setReduit] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduit)
      .catch(() => setReduit(false));
  }, []);
  useEffect(() => {
    if (reduit) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(echelle, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(echelle, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [echelle, reduit]);
  return <Animated.View style={[styles.halo, { transform: [{ scale: echelle }] }]} />;
}

export default function SosEcran() {
  const { utilisateur } = useAuth();
  const [nbPersonnes, setNbPersonnes] = useState('1');
  const [description, setDescription] = useState('');
  const [telephone, setTelephone] = useState(utilisateur?.telephone ?? '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [demandes, setDemandes] = useState<DemandeSecours[]>([]);

  const progres = useRef(new Animated.Value(0)).current;
  const charger = () =>
    api
      .mesDemandesSecours()
      .then(setDemandes)
      .catch(() => null);

  function commencerMaintien() {
    if (envoi) return;
    haptique.appui();
    Animated.timing(progres, { toValue: 1, duration: DUREE_MAINTIEN_MS, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        haptique.fort();
        void envoyer();
      }
    });
  }

  function arreterMaintien() {
    progres.stopAnimation((v) => {
      if (v < 1) Animated.timing(progres, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  }
  useEffect(() => {
    void charger();
  }, []);

  async function envoyer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const pos = await positionActuelle();
      if (!pos) throw new Error('Position indisponible : autorisez la localisation, ou appelez le 180.');
      await api.sos({
        ...pos,
        nbPersonnes: Math.max(1, Number.parseInt(nbPersonnes, 10) || 1),
        description: description.trim() || undefined,
        telephone: telephone.trim() || undefined,
      });
      haptique.succes();
      await charger();
    } catch (e) {
      haptique.erreur();
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
      progres.setValue(0);
    }
  }

  const enCours = demandes.find((d) => d.statut === 'EN_ATTENTE' || d.statut === 'PRISE_EN_CHARGE');

  return (
    <Ecran enTeteSysteme>
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}

      {enCours ? (
        <View style={[styles.suivi, ombre.moyenne]} accessibilityLiveRegion="polite">
          <View style={styles.iconeSuivi}>
            {enCours.statut === 'PRISE_EN_CHARGE' ? (
              <Ambulance size={32} color={couleurs.surFonce} />
            ) : (
              <Hourglass size={32} color={couleurs.surFonce} />
            )}
          </View>
          <Texte variante="titre2" couleur={couleurs.surFonce} style={{ textAlign: 'center' }}>
            {enCours.statut === 'PRISE_EN_CHARGE' ? 'Les secours arrivent' : 'Demande envoyée'}
          </Texte>
          <Texte variante="petit" couleur={couleurs.surFonce} style={{ textAlign: 'center', opacity: 0.9 }}>
            {ilYa(enCours.createdAt)}
            {enCours.secouriste ? ` · pris en charge par ${enCours.secouriste.nom}` : ' · en attente d’une équipe'}
          </Texte>
          <View style={styles.consigne}>
            <ShieldCheck size={20} color={couleurs.sos} />
            <Texte variante="petit" style={{ flex: 1 }}>
              Restez en hauteur, gardez votre téléphone allumé et faites-vous voir (lampe, tissu de couleur).
            </Texte>
          </View>
          {enCours.statut === 'EN_ATTENTE' ? (
            <Bouton
              libelle="Annuler ma demande"
              variante="contour"
              petit
              onPress={async () => {
                await api.majSecours(enCours.id, 'ANNULEE').catch((e: Error) => setErreur(e.message));
                await charger();
              }}
            />
          ) : null}
        </View>
      ) : (
        <>
          <Texte variante="corps" couleur={couleurs.texteSecondaire} style={{ textAlign: 'center', marginBottom: espace.m }}>
            Maintenez le bouton appuyé : votre position sera envoyée aux équipes de secours. À utiliser uniquement si des personnes sont en
            danger.
          </Texte>

          <View style={styles.zoneBouton}>
            <Halo />
            <Pressable
              onPressIn={commencerMaintien}
              onPressOut={arreterMaintien}
              disabled={envoi}
              accessibilityRole="button"
              accessibilityLabel="SOS : envoyer une demande de secours avec ma position"
              accessibilityHint="Maintenir appuyé pour envoyer. Avec un lecteur d'écran, toucher deux fois."
              accessibilityState={{ busy: envoi }}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={(e) => {
                if (e.nativeEvent.actionName === 'activate') void envoyer();
              }}
              style={[styles.boutonSos, { backgroundColor: couleurs.sos }, ombre.forte]}
            >
              {/* Remplissage progressif pendant le maintien */}
              <Animated.View pointerEvents="none" style={[styles.remplissage, { transform: [{ scale: progres }] }]} />
              <View style={styles.contenuSos}>
                <Siren size={40} color={couleurs.surFonce} strokeWidth={2.2} />
                <Texte variante="affiche" couleur={couleurs.surFonce}>
                  {envoi ? '…' : 'SOS'}
                </Texte>
                <Texte variante="legende" couleur={couleurs.surFonce} style={{ textAlign: 'center' }}>
                  {envoi ? 'ENVOI EN COURS' : 'MAINTENIR APPUYÉ'}
                </Texte>
              </View>
            </Pressable>
          </View>

          <Carte>
            <Texte variante="titre3" style={{ marginBottom: espace.sm }}>
              Aidez les secours (facultatif)
            </Texte>
            <Champ libelle="Nombre de personnes" value={nbPersonnes} onChangeText={setNbPersonnes} keyboardType="number-pad" />
            <Champ
              libelle="Situation"
              value={description}
              onChangeText={setDescription}
              placeholder="Ex. : bloqués au 1er étage, une personne âgée"
            />
            <Champ libelle="Téléphone pour vous joindre" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
          </Carte>
        </>
      )}

      <EnTeteSection titre="Numéros d'urgence" />
      <View style={styles.numeros}>
        {NUMEROS.map((n) => (
          <Pressable
            key={n.numero}
            onPress={() => Linking.openURL(`tel:${n.numero}`)}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${n.libelle}, ${n.numero}`}
            style={({ pressed }) => [styles.numero, { backgroundColor: pressed ? couleurs.surfaceAlt : couleurs.surface }]}
          >
            <Phone size={18} color={couleurs.sos} />
            <Texte variante="titre2">{n.numero}</Texte>
            <Texte variante="legende" couleur={couleurs.texteSecondaire} style={{ textAlign: 'center' }}>
              {n.libelle}
            </Texte>
          </Pressable>
        ))}
      </View>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  zoneBouton: { alignItems: 'center', justifyContent: 'center', height: taille.sos + 56, marginBottom: espace.m },
  halo: {
    position: 'absolute',
    width: taille.sos + 40,
    height: taille.sos + 40,
    borderRadius: (taille.sos + 40) / 2,
    backgroundColor: couleurs.sosDoux,
  },
  boutonSos: {
    width: taille.sos,
    height: taille.sos,
    borderRadius: taille.sos / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: couleurs.surface,
    paddingHorizontal: espace.m,
    overflow: 'hidden',
  },
  contenuSos: { alignItems: 'center', zIndex: 1 },
  remplissage: {
    position: 'absolute',
    width: taille.sos,
    height: taille.sos,
    borderRadius: taille.sos / 2,
    backgroundColor: couleurs.sosPresse,
  },
  suivi: { backgroundColor: couleurs.sos, borderRadius: rayon.xl, padding: espace.l, alignItems: 'center', gap: espace.s },
  iconeSuivi: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: couleurs.voileClairFort,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.s,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.m,
    padding: espace.sm,
    marginTop: espace.s,
    alignSelf: 'stretch',
  },
  numeros: { flexDirection: 'row', gap: espace.s },
  numero: {
    flex: 1,
    minHeight: 96,
    borderRadius: rayon.l,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espace.xxs,
    padding: espace.s,
  },
});
