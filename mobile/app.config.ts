import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Complète app.json avec les valeurs secrètes du fichier .env :
 *  - GOOGLE_MAPS_API_KEY : clé Google Maps SDK (Android / iOS), nécessaire pour les builds,
 *    pas pour Expo Go
 *  - EAS_PROJECT_ID : identifiant du projet Expo (eas init), nécessaire aux notifications push
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
  extra: {
    ...config.extra,
    eas: { projectId: process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId || undefined },
  },
});
