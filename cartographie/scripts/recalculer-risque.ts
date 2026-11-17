/** Recalcule le niveau de risque de chaque zone et l'envoie au back-end : npm run risque:recalculer */
import { recalculerEtPublier } from '../src/risque/recalculer.js';
import { chargerStations } from '../src/sodexam/import.js';
import { ZonesStore } from '../src/zones/zones.js';

const { resultats, envoyesAuBackend } = await recalculerEtPublier(new ZonesStore(), chargerStations(), []);
console.table(
  resultats.map((r) => ({
    zone: r.nom,
    station: r.station,
    'pluie 24h (mm)': r.pluieObservee24hMm?.toFixed(1) ?? '—',
    'prévue 24h (mm)': r.pluiePrevue24hMm?.toFixed(1) ?? '—',
    signalements: r.nbSignalements,
    score: r.score,
    niveau: r.niveau,
  })),
);
console.log(`✔ ${envoyesAuBackend}/${resultats.length} zones mises à jour dans le back-end`);
