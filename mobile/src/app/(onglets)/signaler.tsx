import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, CircleCheck, ImagePlus, MapPin, RefreshCw, Send, Siren, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Bandeau, Bouton, BoutonIcone, Champ, Ecran, Texte } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { NIVEAUX_INONDATION } from '../../lib/format';
import { positionActuelle } from '../../lib/position';
import type { NiveauInondation, Point } from '../../lib/types';
import { couleurs, espace, rayon } from '../../theme';

function Etape({ numero, titre, children, fait }: { numero: number; titre: string; children: ReactNode; fait: boolean }) {
  return (
    <View style={{ marginBottom: espace.l }}>
      <View style={[styles.ligne, { marginBottom: espace.sm }]}>
        <View style={[styles.numero, fait ? { backgroundColor: couleurs.succes } : null]}>
          {fait ? (
            <CircleCheck size={16} color={couleurs.surFonce} strokeWidth={2.6} />
          ) : (
            <Texte variante="petitGras" couleur={couleurs.surPrimaire}>
              {numero}
            </Texte>
          )}
        </View>
        <Texte variante="titre3" accessibilityRole="header">
          {titre}
        </Texte>
      </View>
      {children}
    </View>
  );
}

export default function SignalerEcran() {
  const router = useRouter();
  const { rafraichir } = useAuth();
  const [position, setPosition] = useState<Point | null>(null);
  const [localisation, setLocalisation] = useState<'recherche' | 'ok' | 'refusee'>('recherche');
  const [niveau, setNiveau] = useState<NiveauInondation | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function localiser() {
    setLocalisation('recherche');
    const p = await positionActuelle();
    setPosition(p);
    setLocalisation(p ? 'ok' : 'refusee');
  }

  useEffect(() => {
    void localiser();
  }, []);

  async function prendrePhoto(source: 'camera' | 'galerie') {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.6 };
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return setErreur("L'accès à l'appareil photo a été refusé.");
    }
    const r = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!r.canceled) setPhoto(r.assets[0]);
  }

  async function envoyer() {
    if (!position || !niveau) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const photoUrl = photo ? (await api.envoyerPhoto(photo.uri, photo.mimeType ?? 'image/jpeg')).url : undefined;
      await api.signaler({ ...position, niveau, description: description.trim(), photoUrl });
      setSucces(
        niveau === 'ELEVE'
          ? 'Signalement envoyé. Si des personnes sont en danger, utilisez aussi le bouton SOS.'
          : 'Merci ! Votre signalement est visible sur la carte et sera vérifié. +5 points citoyens.',
      );
      setNiveau(null);
      setDescription('');
      setPhoto(null);
      void rafraichir(); // points et badges
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }

  const descriptionOk = description.trim().length >= 5;

  return (
    <Ecran titre="Signaler une inondation" sousTitre="Votre signalement aide les secours et prévient vos voisins.">
      {succes ? <Bandeau type="succes" icone={CircleCheck} texte={succes} /> : null}
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}

      <Etape numero={1} titre="Où êtes-vous ?" fait={!!position}>
        <View style={styles.carteLieu}>
          <View style={styles.iconeLieu}>
            {localisation === 'recherche' ? <ActivityIndicator color={couleurs.primaire} /> : <MapPin size={20} color={couleurs.primaire} />}
          </View>
          <View style={{ flex: 1 }}>
            <Texte variante="corpsGras">
              {localisation === 'recherche' ? 'Recherche de votre position…' : position ? 'Position trouvée' : 'Position indisponible'}
            </Texte>
            <Texte variante="petit" couleur={couleurs.texteSecondaire}>
              {position
                ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
                : localisation === 'refusee'
                  ? 'Autorisez la localisation dans les réglages'
                  : 'GPS en cours'}
            </Texte>
          </View>
          <BoutonIcone icone={RefreshCw} libelle="Actualiser la position" onPress={localiser} variante="transparent" />
        </View>
      </Etape>

      <Etape numero={2} titre="Quel niveau d'eau ?" fait={!!niveau}>
        <View style={{ gap: espace.s }} accessibilityRole="radiogroup">
          {(Object.keys(NIVEAUX_INONDATION) as NiveauInondation[]).map((n) => {
            const actif = niveau === n;
            const s = NIVEAUX_INONDATION[n];
            return (
              <Pressable
                key={n}
                onPress={() => setNiveau(n)}
                accessibilityRole="radio"
                accessibilityState={{ checked: actif }}
                accessibilityLabel={`${s.libelle} : ${s.aide}`}
                style={({ pressed }) => [
                  styles.choix,
                  {
                    borderColor: actif ? s.couleur : couleurs.bordure,
                    backgroundColor: actif ? s.doux : pressed ? couleurs.surfaceAlt : couleurs.surface,
                  },
                ]}
              >
                <View style={[styles.iconeChoix, { backgroundColor: actif ? s.couleur : s.doux }]}>
                  <s.icone size={22} color={actif ? couleurs.surFonce : s.couleur} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Texte variante="corpsGras" couleur={s.couleur}>
                    {s.libelle}
                  </Texte>
                  <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                    {s.aide}
                  </Texte>
                </View>
                <View style={[styles.radio, { borderColor: actif ? s.couleur : couleurs.bordureForte }]}>
                  {actif ? <View style={[styles.radioPlein, { backgroundColor: s.couleur }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Etape>

      <Etape numero={3} titre="Que voyez-vous ?" fait={descriptionOk}>
        <Champ
          libelle="Description"
          multiline
          maxLength={1000}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex. : la route est recouverte d'eau, les voitures ne passent plus."
          aide={`${description.length}/1000 — précisez un repère (carrefour, école, marché…)`}
        />
      </Etape>

      <Etape numero={4} titre="Ajouter une photo (facultatif)" fait={!!photo}>
        {photo ? (
          <View>
            <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="Photo jointe au signalement" />
            <BoutonIcone icone={X} libelle="Retirer la photo" onPress={() => setPhoto(null)} style={styles.retirer} />
          </View>
        ) : (
          <View style={styles.ligne}>
            <Bouton libelle="Prendre" icone={Camera} variante="contour" onPress={() => prendrePhoto('camera')} style={{ flex: 1 }} />
            <Bouton libelle="Galerie" icone={ImagePlus} variante="contour" onPress={() => prendrePhoto('galerie')} style={{ flex: 1 }} />
          </View>
        )}
      </Etape>

      <Bouton
        libelle="Envoyer le signalement"
        icone={Send}
        onPress={envoyer}
        chargement={envoi}
        desactive={!position || !niveau || !descriptionOk}
      />
      <Bouton libelle="Des personnes en danger ? SOS" icone={Siren} variante="fantome" onPress={() => router.push('/sos')} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espace.s },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteLieu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.l,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    paddingLeft: espace.m,
    paddingVertical: espace.s,
  },
  iconeLieu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: couleurs.primaireDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    borderWidth: 2,
    borderRadius: rayon.l,
    padding: espace.sm,
    minHeight: 72,
  },
  iconeChoix: { width: 44, height: 44, borderRadius: rayon.m, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioPlein: { width: 12, height: 12, borderRadius: 6 },
  photo: { width: '100%', height: 200, borderRadius: rayon.l },
  retirer: { position: 'absolute', top: espace.s, right: espace.s },
});
