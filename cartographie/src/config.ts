import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  /** Clé partagée avec le back-end (en-tête x-api-key) */
  cleInterne: process.env.INTERNAL_API_KEY ?? '',
  /** URL de l'API FlowManage, ex. http://localhost:3000/api/v1 */
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3000/api/v1',
  /** Clé Google Maps Platform (Routes API + Geocoding API activées) */
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  /** Recalcul automatique du risque toutes les N minutes (0 = désactivé) */
  recalculAutoMin: Number(process.env.RECALCUL_AUTO_MIN ?? 0),
  /** Fichier GeoJSON des zones à risque */
  fichierZones: process.env.FICHIER_ZONES ?? 'data/zones-abidjan-demo.geojson',
};
