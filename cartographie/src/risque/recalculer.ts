import { booleanPointInPolygon, distance, point } from '@turf/turf';
import { backend } from '../backend.js';
import { pluiePrevue } from '../meteo/prevision.js';
import { cumulPluie } from '../sodexam/import.js';
import type { Observation, PointInonde, Station } from '../types.js';
import type { ZonesStore } from '../zones/zones.js';
import { calculerScore } from './score.js';

export interface Sources {
  observations: Observation[];
  signalements: PointInonde[];
  /** Prévision par zone ; null = indisponible */
  prevision: (centre: { latitude: number; longitude: number }) => Promise<number | null>;
}

/** Station la plus proche (≤ 15 km) d'un point. */
function stationProche(stations: Station[], lat: number, lng: number) {
  const pt = point([lng, lat]);
  return stations
    .map((s) => ({ s, km: distance(pt, point([s.longitude, s.latitude]), { units: 'kilometers' }) }))
    .filter((x) => x.km <= 15)
    .sort((a, b) => a.km - b.km)[0]?.s;
}

/** Recalcule le score de chaque zone à partir de la pluie et des signalements. */
export async function recalculerRisque(store: ZonesStore, stations: Station[], sources: Sources, maintenant = new Date()) {
  const resultats = [];
  for (const zone of store.toutes().features) {
    const centre = store.centre(zone);
    const station = stationProche(stations, centre.latitude, centre.longitude);
    const pluieObservee = station ? cumulPluie(sources.observations, station.code, maintenant) : null;
    const prevue = await sources.prevision(centre);
    const signalements = sources.signalements.filter((s) =>
      booleanPointInPolygon(point([s.longitude, s.latitude]), zone),
    );

    const r = calculerScore({
      scoreBase: zone.properties.scoreBase,
      pluieObservee24hMm: pluieObservee,
      pluiePrevue24hMm: prevue,
      signalements,
    });
    store.majRisque(zone.properties.code, { score: r.score, niveau: r.niveau });
    resultats.push({
      code: zone.properties.code,
      nom: zone.properties.nom,
      station: station?.code ?? null,
      pluieObservee24hMm: pluieObservee,
      pluiePrevue24hMm: prevue,
      nbSignalements: signalements.length,
      ...r,
    });
  }
  return resultats;
}

/** Version branchée sur le back-end et Open-Meteo, avec envoi des nouveaux niveaux. */
export async function recalculerEtPublier(store: ZonesStore, stations: Station[], observationsLocales: Observation[]) {
  const [observationsBackend, signalements] = await Promise.all([
    backend.observations(24).catch(() => [] as Observation[]),
    backend.signalementsRecents(12).catch(() => [] as PointInonde[]),
  ]);
  const resultats = await recalculerRisque(store, stations, {
    observations: [...observationsBackend, ...observationsLocales],
    signalements,
    prevision: (c) => pluiePrevue(c),
  });

  let envoyes = 0;
  for (const r of resultats) {
    try {
      await backend.majRisque(r.code, { niveau: r.niveau, score: r.score, source: 'calcul Floodge (pluie + signalements)' });
      envoyes++;
    } catch {
      /* back-end indisponible : le résultat reste disponible dans ce service */
    }
  }
  return { resultats, envoyesAuBackend: envoyes };
}
