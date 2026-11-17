import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Bouton, Ecran, Message, SousTitre, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { NIVEAUX_INONDATION } from '../../lib/format';
import { positionActuelle } from '../../lib/position';
import type { NiveauInondation, Point } from '../../lib/types';
import { couleurs, espace, police, rayon } from '../../theme';

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
      const s = await api.signaler({ ...position, niveau, description: description.trim(), photoUrl });
      setSucces(
        s.analyseIa?.besoinSecours || niveau === 'ELEVE'
          ? 'Signalement envoyé. Si des personnes sont en danger, utilisez aussi le bouton SOS.'
          : 'Merci ! Votre signalement est visible sur la carte et sera vérifié.',
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

  return (
    <Ecran titre="Signaler une inondation">
      {succes ? <Message type="succes" texte={succes} /> : null}
      {erreur ? <Message type="erreur" texte={erreur} /> : null}

      <SousTitre>Localisation</SousTitre>
      <View style={[styles.carte, styles.ligne, { justifyContent: 'space-between' }]}>
        <Text style={[styles.texte, { flex: 1 }]}>
          {localisation === 'recherche'
            ? 'Recherche de votre position…'
            : position
              ? `📍 ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
              : 'Position indisponible : autorisez la localisation.'}
        </Text>
        <Pressable onPress={localiser}>
          <Text style={{ color: couleurs.primaire, fontWeight: '600' }}>Actualiser</Text>
        </Pressable>
      </View>

      <SousTitre>Niveau d'inondation</SousTitre>
      {(Object.keys(NIVEAUX_INONDATION) as NiveauInondation[]).map((n) => {
        const actif = niveau === n;
        const { libelle, aide, couleur } = NIVEAUX_INONDATION[n];
        return (
          <Pressable
            key={n}
            onPress={() => setNiveau(n)}
            accessibilityRole="radio"
            accessibilityState={{ selected: actif }}
            style={{
              borderWidth: 2,
              borderColor: actif ? couleur : couleurs.bordure,
              backgroundColor: actif ? `${couleur}1A` : couleurs.surface,
              borderRadius: rayon.m,
              padding: espace.m,
              marginBottom: espace.s,
            }}
          >
            <Text style={{ fontSize: police.moyenne, fontWeight: '700', color: couleur }}>{libelle}</Text>
            <Text style={styles.texteSecondaire}>{aide}</Text>
          </Pressable>
        );
      })}

      <SousTitre>Description</SousTitre>
      <TextInput
        style={[styles.champ, { minHeight: 90, textAlignVertical: 'top' }]}
        multiline
        maxLength={1000}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex. : La route est recouverte d'eau et les véhicules ne peuvent plus passer."
        placeholderTextColor={couleurs.texteSecondaire}
      />

      <SousTitre>Photo (facultatif)</SousTitre>
      {photo ? (
        <View>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 200, borderRadius: rayon.m }} />
          <Bouton libelle="Retirer la photo" variante="discret" onPress={() => setPhoto(null)} />
        </View>
      ) : (
        <View style={styles.ligne}>
          <Bouton libelle="📷 Prendre" variante="secondaire" onPress={() => prendrePhoto('camera')} style={{ flex: 1 }} />
          <Bouton libelle="🖼️ Galerie" variante="secondaire" onPress={() => prendrePhoto('galerie')} style={{ flex: 1 }} />
        </View>
      )}

      <Bouton
        libelle="Envoyer le signalement"
        onPress={envoyer}
        chargement={envoi}
        desactive={!position || !niveau || description.trim().length < 5}
        style={{ marginTop: espace.l }}
      />
      <Bouton libelle="Des personnes sont en danger ? SOS" variante="danger" onPress={() => router.push('/sos')} />
    </Ecran>
  );
}
