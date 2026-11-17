import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { duree, NIVEAUX_ALERTE, NIVEAUX_INONDATION, NIVEAUX_RISQUE } from '../../lib/format';
import { ABIDJAN, decoderPolyline, positionActuelle } from '../../lib/position';
import type { Alerte, Itineraire, Point, Signalement, ZoneFeature } from '../../lib/types';
import { couleurs, espace, police, rayon } from '../../theme';

/** Anneaux extérieurs d'une zone GeoJSON → coordonnées react-native-maps */
function contours(z: ZoneFeature): LatLng[][] {
  const polygones = z.geometry.type === 'Polygon' ? [z.geometry.coordinates] : z.geometry.coordinates;
  return polygones.map((p) => p[0].map(([longitude, latitude]) => ({ latitude, longitude })));
}

export default function CarteEcran() {
  const router = useRouter();
  const carte = useRef<MapView>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [destination, setDestination] = useState<Point | null>(null);
  const [itineraires, setItineraires] = useState<Itineraire[]>([]);
  const [infoItineraire, setInfoItineraire] = useState<string | null>(null);
  const [calcul, setCalcul] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const pos = await positionActuelle();
      setPosition(pos);
      const [z, s, a] = await Promise.all([api.zones(), api.signalements({ heures: 48 }), api.alertes(pos ?? undefined)]);
      setZones(z.features);
      setSignalements(s);
      setAlertes(a);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  async function calculerItineraire() {
    if (!destination) return;
    const depart = position ?? (await positionActuelle());
    if (!depart) {
      setInfoItineraire('Activez la localisation pour calculer un itinéraire.');
      return;
    }
    setCalcul(true);
    setInfoItineraire(null);
    try {
      const r = await api.itineraireSur(depart, destination);
      setItineraires(r.itineraires);
      const reco = r.recommande;
      setInfoItineraire(
        r.avertissement ??
          (reco
            ? `Itinéraire sûr : ${(reco.distanceMetres / 1000).toFixed(1)} km, ${duree(reco.dureeSecondes)}`
            : 'Aucun itinéraire trouvé.'),
      );
      const tous = r.itineraires.flatMap((i) => decoderPolyline(i.polyline));
      if (tous.length) {
        carte.current?.fitToCoordinates(tous, { edgePadding: { top: 120, bottom: 200, left: 40, right: 40 }, animated: true });
      }
    } catch (e) {
      setInfoItineraire((e as Error).message);
    } finally {
      setCalcul(false);
    }
  }

  function effacerItineraire() {
    setDestination(null);
    setItineraires([]);
    setInfoItineraire(null);
  }

  const alerteUrgente = alertes.find((a) => a.niveau === 'DANGER') ?? alertes.find((a) => a.niveau === 'VIGILANCE');

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={carte}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...ABIDJAN, latitudeDelta: 0.18, longitudeDelta: 0.18 }}
        showsUserLocation
        showsMyLocationButton
        onLongPress={(e) => {
          setDestination(e.nativeEvent.coordinate);
          setItineraires([]);
          setInfoItineraire('Destination choisie. Appuyez sur « Itinéraire sûr ».');
        }}
      >
        {zones.map((z) =>
          contours(z).map((coords, i) => (
            <Polygon
              key={`${z.properties.code}-${i}`}
              coordinates={coords}
              fillColor={`${NIVEAUX_RISQUE[z.properties.niveau].couleur}40`}
              strokeColor={NIVEAUX_RISQUE[z.properties.niveau].couleur}
              strokeWidth={1.5}
              tappable
              onPress={() =>
                setInfoItineraire(
                  `${z.properties.nom} (${z.properties.commune}) — ${NIVEAUX_RISQUE[z.properties.niveau].libelle}` +
                    (z.properties.estDemo ? ' · zone de démonstration' : ''),
                )
              }
            />
          )),
        )}

        {signalements.map((s) => (
          <Marker
            key={s.id}
            coordinate={s}
            pinColor={NIVEAUX_INONDATION[s.niveau].couleur}
            title={`${NIVEAUX_INONDATION[s.niveau].libelle} — ${s.commune ?? 'Signalement'}`}
            description={s.description}
            onCalloutPress={() => router.push(`/signalement/${s.id}`)}
          />
        ))}

        {itineraires.map((it, i) => (
          <Polyline
            key={i}
            coordinates={decoderPolyline(it.polyline)}
            strokeWidth={i === 0 ? 6 : 3}
            strokeColor={i === 0 ? (it.sur ? couleurs.primaire : couleurs.modere) : '#90A4AE'}
            zIndex={i === 0 ? 2 : 1}
          />
        ))}

        {destination ? <Marker coordinate={destination} title="Destination" pinColor={couleurs.primaire} /> : null}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.haut} pointerEvents="box-none">
        {alerteUrgente ? (
          <Pressable
            onPress={() => router.push('/alertes')}
            style={[styles.bandeau, { backgroundColor: NIVEAUX_ALERTE[alerteUrgente.niveau].couleur }]}
          >
            <Text style={styles.texteBandeau} numberOfLines={2}>
              ⚠️ {alerteUrgente.titre}
              {alerteUrgente.distanceKm != null ? ` · à ${alerteUrgente.distanceKm} km` : ''}
            </Text>
          </Pressable>
        ) : null}
        {erreur ? (
          <Pressable onPress={charger} style={[styles.bandeau, { backgroundColor: couleurs.erreur }]}>
            <Text style={styles.texteBandeau}>{erreur} — toucher pour réessayer</Text>
          </Pressable>
        ) : null}
        {chargement ? <ActivityIndicator style={{ marginTop: espace.s }} color={couleurs.primaire} /> : null}
      </SafeAreaView>

      <View style={styles.bas} pointerEvents="box-none">
        {infoItineraire ? (
          <View style={styles.info}>
            <Text style={{ color: couleurs.texte, fontSize: police.normale }}>{infoItineraire}</Text>
          </View>
        ) : (
          <View style={styles.info}>
            <Text style={{ color: couleurs.texteSecondaire, fontSize: police.petite }}>
              Appui long sur la carte : choisir une destination et calculer un itinéraire qui évite les rues inondées.
            </Text>
          </View>
        )}
        <View style={styles.actions}>
          {destination ? (
            <>
              <Pressable style={[styles.action, { backgroundColor: couleurs.primaire }]} onPress={calculerItineraire}>
                {calcul ? <ActivityIndicator color="#fff" /> : <Text style={styles.texteAction}>Itinéraire sûr</Text>}
              </Pressable>
              <Pressable style={[styles.action, { backgroundColor: couleurs.texteSecondaire }]} onPress={effacerItineraire}>
                <Text style={styles.texteAction}>Effacer</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[styles.action, { backgroundColor: couleurs.surface }]} onPress={charger}>
              <Text style={[styles.texteAction, { color: couleurs.primaire }]}>Actualiser</Text>
            </Pressable>
          )}
          <Pressable style={[styles.action, styles.sos]} onPress={() => router.push('/sos')}>
            <Text style={styles.texteAction}>SOS</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  haut: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: espace.m },
  bandeau: { borderRadius: rayon.m, padding: espace.m, marginTop: espace.s },
  texteBandeau: { color: '#fff', fontWeight: '700', fontSize: police.normale },
  bas: { position: 'absolute', bottom: espace.m, left: espace.m, right: espace.m },
  info: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.m,
    padding: espace.m,
    marginBottom: espace.s,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actions: { flexDirection: 'row', gap: espace.s },
  action: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 52,
    borderRadius: rayon.m,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sos: { backgroundColor: couleurs.sos, flexGrow: 0, flexShrink: 0, flexBasis: 84 },
  texteAction: { color: '#fff', fontWeight: '700', fontSize: police.moyenne },
});
