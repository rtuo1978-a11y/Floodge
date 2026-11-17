/** Envoie les zones du fichier GeoJSON au back-end : npm run zones:envoyer */
import { backend } from '../src/backend.js';
import { ZonesStore } from '../src/zones/zones.js';

const store = new ZonesStore();
const zones = store.pourBackend();
const res = await backend.envoyerZones(zones);
console.log(`✔ ${res.importees} zones envoyées au back-end`);
