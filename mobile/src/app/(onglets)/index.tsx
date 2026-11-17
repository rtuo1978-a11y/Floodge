import { useFocusEffect, useRouter } from 'expo-router';
import { Check, LocateFixed, MapPin, RefreshCw, Route, Siren, TriangleExclamationPoint, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo, NomMarque } from '../../components/Logo';
import { haptique } from '../../lib/haptique';
import { Bouton, BoutonIcone, PastilleNiveau, Texte } from '../../components/ui';
import { api } from '../../lib/api';
import { distance, duree, ilYa, NIVEAUX_ALERTE, NIVEAUX_INONDATION, NIVEAUX_RISQUE } from '../../lib/format';
import { ABIDJAN, decoderPolyline, positionActuelle } from '../../lib/position';
import type { Alerte, Itineraire, NiveauRisque, Point, Signalement, ZoneFeature } from '../../lib/types';
import { couleurs, espace, ombre, rayon, taille } from '../../theme';

/** Anneaux extérieurs d'une zone GeoJSON → coordonnées react-native-maps */
function contours(z: ZoneFeature): LatLng[][] {
  const polygones = z.geometry.type === 'Polygon' ? [z.geometry.coordinates] : z.geometry.coordinates;
  return polygones.map((p) => p[0].map(([longitude, latitude]) => ({ latitude, longitude })));
}

type Selection =
  | { type: 'zone'; zone: ZoneFeature }
  | { type: 'signalement'; signalement: Signalement }
  | { type: 'itineraire'; texte: string; sur: boolean }
  | { type: 'destination' }
  | null;

const LEGENDE: NiveauRisque[] = ['FAIBLE', 'MODERE', 'ELEVE', 'TRES_ELEVE'];

export default function CarteEcran() {
  const router = useRouter();
  const carte = useRef<MapView>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  // Filtres de la carte : niveaux de risque affichés + couche des signalements
  const [niveauxVisibles, setNiveauxVisibles] = useState<Set<NiveauRisque>>(new Set(LEGENDE));
  const [voirSignalements, setVoirSignalements] = useState(true);

  function basculerNiveau(n: NiveauRisque) {
    haptique.selection();
    setNiveauxVisibles((avant) => {
      const apres = new Set(avant);
      if (apres.has(n)) apres.delete(n);
      else apres.add(n);
      return apres;
    });
  }

  const [destination, setDestination] = useState<Point | null>(null);
  const [itineraires, setItineraires] = useState<Itineraire[]>([]);
  const [calcul, setCalcul] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    setChargement(true);
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

  function recentrer() {
    const centre = position ?? ABIDJAN;
    carte.current?.animateToRegion({ ...centre, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 400);
  }

  async function calculerItineraire() {
    if (!destination) return;
    const depart = position ?? (await positionActuelle());
    if (!depart) {
      setSelection({
        type: 'itineraire',
        texte: 'Activez la localisation pour calculer un itinéraire.',
        sur: false,
      });
      return;
    }
    setCalcul(true);
    try {
      const r = await api.itineraireSur(depart, destination);
      setItineraires(r.itineraires);
      const reco = r.recommande;
      setSelection({
        type: 'itineraire',
        sur: !!reco?.sur,
        texte:
          r.avertissement ??
          (reco
            ? `${(reco.distanceMetres / 1000).toFixed(1)} km · ${duree(reco.dureeSecondes)} · aucune rue inondée signalée`
            : 'Aucun itinéraire trouvé.'),
      });
      const tous = r.itineraires.flatMap((i) => decoderPolyline(i.polyline));
      if (tous.length) {
        carte.current?.fitToCoordinates(tous, {
          edgePadding: { top: 160, bottom: 280, left: 40, right: 40 },
          animated: true,
        });
      }
    } catch (e) {
      setSelection({
        type: 'itineraire',
        texte: (e as Error).message,
        sur: false,
      });
    } finally {
      setCalcul(false);
    }
  }

  function effacerItineraire() {
    setDestination(null);
    setItineraires([]);
    setSelection(null);
  }

  const alerteUrgente = alertes.find((a) => a.niveau === 'DANGER') ?? alertes.find((a) => a.niveau === 'VIGILANCE');

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.fond }}>
      <MapView
        ref={carte}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          ...ABIDJAN,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => !destination && setSelection(null)}
        onLongPress={(e) => {
          setDestination(e.nativeEvent.coordinate);
          setItineraires([]);
          setSelection({ type: 'destination' });
        }}
      >
        {zones
          .filter((z) => niveauxVisibles.has(z.properties.niveau))
          .map((z) =>
            contours(z).map((coords, i) => (
              <Polygon
                key={`${z.properties.code}-${i}`}
                coordinates={coords}
                fillColor={`${NIVEAUX_RISQUE[z.properties.niveau].couleur}33`}
                strokeColor={NIVEAUX_RISQUE[z.properties.niveau].couleur}
                strokeWidth={2}
                tappable
                onPress={() => {
                  haptique.selection();
                  setSelection({ type: 'zone', zone: z });
                }}
              />
            )),
          )}

        {(voirSignalements ? signalements : []).map((s) => {
          const n = NIVEAUX_INONDATION[s.niveau];
          return (
            <Marker
              key={s.id}
              coordinate={s}
              pinColor={n.couleur}
              tracksViewChanges={false}
              accessibilityLabel={`Signalement ${n.libelle}`}
              onPress={() => setSelection({ type: 'signalement', signalement: s })}
            >
              <View style={[styles.marqueur, { backgroundColor: n.couleur }]}>
                <n.icone size={16} color={couleurs.surFonce} strokeWidth={2.5} />
              </View>
            </Marker>
          );
        })}

        {itineraires.map((it, i) => (
          <Polyline
            key={i}
            coordinates={decoderPolyline(it.polyline)}
            strokeWidth={i === 0 ? 6 : 4}
            strokeColor={i === 0 ? (it.sur ? couleurs.primaire : couleurs.modere) : couleurs.bordureForte}
            zIndex={i === 0 ? 2 : 1}
          />
        ))}

        {destination ? <Marker coordinate={destination} title="Destination" pinColor={couleurs.primaire} /> : null}
      </MapView>

      {/* ---------- Haut : en-tête flottant, alerte, légende ---------- */}
      <SafeAreaView edges={['top']} style={styles.haut} pointerEvents="box-none">
        <View style={[styles.barre, ombre.moyenne]}>
          <Logo taille={36} />
          <View style={{ flex: 1 }}>
            <NomMarque taille={19} />
            <Texte variante="petit" couleur={couleurs.texteSecondaire} numberOfLines={1}>
              {chargement ? 'Mise à jour…' : `${signalements.length} signalement(s) · ${zones.length} zones suivies`}
            </Texte>
          </View>
          {chargement ? (
            <ActivityIndicator color={couleurs.primaire} style={{ width: taille.cible }} />
          ) : (
            <BoutonIcone icone={RefreshCw} libelle="Actualiser la carte" onPress={charger} variante="transparent" />
          )}
        </View>

        {alerteUrgente ? (
          <Pressable
            onPress={() => router.push('/alertes')}
            accessibilityRole="button"
            accessibilityLabel={`Alerte ${NIVEAUX_ALERTE[alerteUrgente.niveau].libelle} : ${alerteUrgente.titre}. Voir les alertes`}
            style={({ pressed }) => [
              styles.alerte,
              {
                backgroundColor: NIVEAUX_ALERTE[alerteUrgente.niveau].couleur,
                opacity: pressed ? 0.9 : 1,
              },
              ombre.moyenne,
            ]}
          >
            <TriangleExclamationPoint size={22} color={couleurs.surFonce} strokeWidth={2.4} />
            <View style={{ flex: 1 }}>
              <Texte variante="corpsGras" couleur={couleurs.surFonce} numberOfLines={1}>
                {alerteUrgente.titre}
              </Texte>
              <Texte variante="petit" couleur={couleurs.surFonce} numberOfLines={1}>
                {[
                  NIVEAUX_ALERTE[alerteUrgente.niveau].libelle,
                  distance(alerteUrgente.distanceKm),
                  alerteUrgente.publieeLe ? ilYa(alerteUrgente.publieeLe) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Texte>
            </View>
          </Pressable>
        ) : null}

        {erreur ? (
          <Pressable onPress={charger} style={[styles.alerte, { backgroundColor: couleurs.erreur }]} accessibilityRole="button">
            <Texte variante="petitGras" couleur={couleurs.surFonce}>
              {erreur} — toucher pour réessayer
            </Texte>
          </Pressable>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legende}
          accessibilityLabel="Filtres de la carte"
        >
          <Pressable
            onPress={() => {
              haptique.selection();
              setVoirSignalements((v) => !v);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: voirSignalements }}
            accessibilityLabel="Afficher les signalements"
            style={[styles.puce, voirSignalements ? styles.puceActive : null, ombre.faible]}
          >
            <MapPin size={14} color={voirSignalements ? couleurs.surPrimaire : couleurs.texteSecondaire} />
            <Texte variante="legende" couleur={voirSignalements ? couleurs.surPrimaire : couleurs.texteSecondaire}>
              SIGNALEMENTS
            </Texte>
          </Pressable>
          {LEGENDE.map((n) => {
            const actif = niveauxVisibles.has(n);
            return (
              <Pressable
                key={n}
                onPress={() => basculerNiveau(n)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: actif }}
                accessibilityLabel={`Zones ${NIVEAUX_RISQUE[n].libelle}`}
                style={[styles.puce, ombre.faible, !actif ? { backgroundColor: couleurs.surfaceAlt } : null]}
              >
                <View
                  style={[
                    styles.pointLegende,
                    {
                      backgroundColor: actif ? NIVEAUX_RISQUE[n].couleur : couleurs.bordureForte,
                    },
                  ]}
                >
                  {actif ? <Check size={8} color={couleurs.surFonce} strokeWidth={4} /> : null}
                </View>
                <Texte variante="legende" couleur={actif ? couleurs.texte : couleurs.texteDesactive}>
                  {NIVEAUX_RISQUE[n].libelle.replace('Risque ', '').toUpperCase()}
                </Texte>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ---------- Bas : boutons flottants + panneau contextuel ---------- */}
      <View style={styles.bas} pointerEvents="box-none">
        <View style={styles.flottants} pointerEvents="box-none">
          <BoutonIcone icone={LocateFixed} libelle="Centrer sur ma position" onPress={recentrer} />
          <Pressable
            onPress={() => {
              haptique.appui();
              router.push('/sos');
            }}
            accessibilityRole="button"
            accessibilityLabel="SOS : demander du secours"
            style={({ pressed }) => [styles.sos, { backgroundColor: pressed ? couleurs.sosPresse : couleurs.sos }, ombre.forte]}
          >
            <Siren size={22} color={couleurs.surFonce} strokeWidth={2.4} />
            <Texte variante="legende" couleur={couleurs.surFonce}>
              SOS
            </Texte>
          </Pressable>
        </View>

        <View style={[styles.panneau, ombre.forte]}>
          <View style={styles.poignee} />
          <Panneau
            selection={selection}
            destination={destination}
            calcul={calcul}
            onCalculer={calculerItineraire}
            onEffacer={effacerItineraire}
            onOuvrirSignalement={(id) => router.push(`/signalement/${id}`)}
            onFermer={() => setSelection(null)}
          />
        </View>
      </View>
    </View>
  );
}

function Panneau({
  selection,
  destination,
  calcul,
  onCalculer,
  onEffacer,
  onOuvrirSignalement,
  onFermer,
}: {
  selection: Selection;
  destination: Point | null;
  calcul: boolean;
  onCalculer: () => void;
  onEffacer: () => void;
  onOuvrirSignalement: (id: string) => void;
  onFermer: () => void;
}) {
  if (selection?.type === 'zone') {
    const p = selection.zone.properties;
    return (
      <>
        <View style={styles.entreHaut}>
          <View style={{ flex: 1 }}>
            <Texte variante="titre3">{p.nom}</Texte>
            <Texte variante="petit" couleur={couleurs.texteSecondaire}>
              {p.commune}
              {p.estDemo ? ' · zone de démonstration' : ''}
            </Texte>
          </View>
          <BoutonIcone icone={X} libelle="Fermer" onPress={onFermer} variante="transparent" />
        </View>
        <View style={styles.ligne}>
          <PastilleNiveau s={NIVEAUX_RISQUE[p.niveau]} />
          <Texte variante="petit" couleur={couleurs.texteSecondaire}>
            Indice {Math.round(p.score)}/100
          </Texte>
        </View>
      </>
    );
  }

  if (selection?.type === 'signalement') {
    const s = selection.signalement;
    return (
      <>
        <View style={styles.entreHaut}>
          <View style={{ flex: 1, gap: espace.xs }}>
            <PastilleNiveau s={NIVEAUX_INONDATION[s.niveau]} />
            <Texte variante="corps" numberOfLines={2}>
              {s.description}
            </Texte>
            <Texte variante="petit" couleur={couleurs.texteSecondaire}>
              {[s.commune, ilYa(s.createdAt), `${s._count.confirmations} confirmation(s)`].filter(Boolean).join(' · ')}
            </Texte>
          </View>
          <BoutonIcone icone={X} libelle="Fermer" onPress={onFermer} variante="transparent" />
        </View>
        <Bouton libelle="Voir le détail" variante="secondaire" petit onPress={() => onOuvrirSignalement(s.id)} />
      </>
    );
  }

  if (destination) {
    const alerte = selection?.type === 'itineraire' && !selection.sur;
    return (
      <>
        <Texte variante="titre3">Itinéraire sûr</Texte>
        <Texte variante="petit" couleur={alerte ? couleurs.modere : couleurs.texteSecondaire}>
          {selection?.type === 'itineraire'
            ? selection.texte
            : 'Destination choisie. Calculez un trajet qui évite les rues signalées inondées.'}
        </Texte>
        <View style={styles.ligne}>
          <Bouton libelle="Calculer" icone={Route} onPress={onCalculer} chargement={calcul} style={{ flex: 1 }} petit />
          <Bouton libelle="Effacer" variante="contour" onPress={onEffacer} style={{ flex: 1 }} petit />
        </View>
      </>
    );
  }

  return (
    <View style={styles.ligne}>
      <View style={styles.iconeAide}>
        <Route size={20} color={couleurs.primaire} />
      </View>
      <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ flex: 1 }}>
        Touchez une zone ou un signalement pour le détail. Appui long sur la carte : itinéraire qui évite les rues inondées.
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  haut: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: espace.m,
    gap: espace.s,
  },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.l,
    paddingLeft: espace.sm,
    paddingRight: espace.xs,
    paddingVertical: espace.s,
    marginTop: espace.s,
  },
  alerte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.sm,
    borderRadius: rayon.l,
    paddingHorizontal: espace.m,
    paddingVertical: espace.sm,
    minHeight: taille.cible,
  },
  legende: { gap: espace.s, paddingVertical: espace.xs },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.xs,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.rond,
    paddingHorizontal: espace.sm,
    minHeight: 36,
  },
  pointLegende: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puceActive: { backgroundColor: couleurs.primaire },
  marqueur: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: couleurs.surface,
  },
  bas: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  flottants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: espace.m,
    marginBottom: espace.sm,
  },
  sos: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: couleurs.surface,
  },
  panneau: {
    backgroundColor: couleurs.surface,
    borderTopLeftRadius: rayon.xl,
    borderTopRightRadius: rayon.xl,
    paddingHorizontal: espace.m,
    paddingTop: espace.s,
    paddingBottom: espace.m,
    gap: espace.s,
  },
  poignee: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.bordureForte,
    marginBottom: espace.xs,
  },
  entreHaut: { flexDirection: 'row', alignItems: 'flex-start', gap: espace.s },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espace.s },
  iconeAide: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: couleurs.primaireDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
