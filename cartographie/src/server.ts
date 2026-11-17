import { creerApp } from './app.js';
import { config } from './config.js';
import { recalculerEtPublier } from './risque/recalculer.js';
import { chargerStations } from './sodexam/import.js';
import { ZonesStore } from './zones/zones.js';

const store = new ZonesStore();
const stations = chargerStations();
const app = creerApp(store, stations);

app.listen(config.port, () => {
  console.log(`Floodge cartographie : http://localhost:${config.port} (${store.toutes().features.length} zones)`);
  if (!config.googleMapsKey) console.warn('⚠ GOOGLE_MAPS_API_KEY absente : itinéraires sûrs désactivés');
});

if (config.recalculAutoMin > 0) {
  setInterval(() => {
    recalculerEtPublier(store, stations, [])
      .then((r) => console.log(`Risque recalculé : ${r.resultats.length} zones, ${r.envoyesAuBackend} envoyées`))
      .catch((e) => console.error('Recalcul du risque :', e));
  }, config.recalculAutoMin * 60_000);
}
