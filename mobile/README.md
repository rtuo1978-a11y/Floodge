# Floodge — Application mobile

Application des habitants, des autorités et des secours.
**React Native · Expo SDK 58 · Expo Router · react-native-maps (Google Maps)**

> Les écrans sont **fonctionnels mais sobres** : l'équipe UI/UX remplacera le style à partir des maquettes Figma. Toutes les couleurs et tailles sont dans `src/theme.ts`, les composants de base dans `src/components/ui.tsx`.

## Écrans

| Onglet / écran | Fichier | Fonction |
|---|---|---|
| Carte | `src/app/(onglets)/index.tsx` | Zones à risque colorées, signalements, bandeau d'alerte, **itinéraire sûr** (appui long = destination), bouton **SOS** |
| Alertes | `src/app/(onglets)/alertes.tsx` | Alertes en cours triées par distance, **lecture vocale**, rechargement toutes les minutes, lecture automatique des nouvelles alertes DANGER |
| Signaler | `src/app/(onglets)/signaler.tsx` | Position GPS, niveau (faible / modéré / élevé), description, photo |
| Conseils | `src/app/(onglets)/conseils.tsx` | Conseils avant / pendant / après (écoute vocale), conseils personnalisés par l'IA |
| Profil | `src/app/(onglets)/profil.tsx` | Points, **badges**, classement **Meilleur citoyen du mois**, mes signalements |
| SOS | `src/app/sos.tsx` | Alerte secours avec position, suivi de la prise en charge, numéros d'urgence (180, 185, 110) |
| Signalement | `src/app/signalement/[id].tsx` | Détail, « je vois aussi l'eau », vérification par les autorités, analyse IA |
| Assistant | `src/app/assistant.tsx` | Discussion avec l'IA Floodge |
| Espace autorités | `src/app/autorite.tsx` | Publier les alertes proposées par le moteur de règles, vérifier les signalements |
| Espace secours | `src/app/secours.tsx` | Demandes SOS, prise en charge, itinéraire, appel |

Le code qui parle à l'API est regroupé dans `src/lib/api.ts` (même noms de routes que `docs/api.md`).

## Lancer l'application

1. Démarrer le back-end (branche `backend`) et noter l'adresse IP de l'ordinateur (`ipconfig` sur Windows).
2. Configurer et lancer :

   ```bash
   cd mobile
   npm install
   cp .env.example .env        # mettre l'IP : EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1
   npx expo start
   ```

3. Scanner le QR code avec **Expo Go** (Android / iOS). Le téléphone et l'ordinateur doivent être sur le **même Wi-Fi**.

Comptes de test (après `npm run seed` côté back-end, mot de passe `Floodge2026!`) : `citoyen1@floodge.ci`, `autorite@floodge.ci`, `secours@floodge.ci`.

## Notifications push et alertes vocales

- Dans **Expo Go**, les alertes sont rechargées toutes les minutes dans l'onglet Alertes et les nouvelles alertes DANGER sont **lues à voix haute** automatiquement.
- Les **notifications push** (alerte reçue téléphone verrouillé) ne fonctionnent pas dans Expo Go sur Android : il faut un *development build* :

  ```bash
  npm install -g eas-cli
  eas login
  eas init                     # copie l'identifiant dans EAS_PROJECT_ID du .env
  eas build --profile development --platform android
  ```

  Pour Android, configurer aussi les identifiants Firebase (FCM V1) : https://docs.expo.dev/push-notifications/fcm-credentials/
- Quand une notification d'alerte arrive, l'application lit le champ `texteVocal` à voix haute.

## Google Maps

Dans Expo Go, la carte fonctionne sans clé. Pour un build (APK), créer une clé **Maps SDK for Android** (et iOS) dans Google Cloud et la mettre dans `GOOGLE_MAPS_API_KEY` du `.env` (lue par `app.config.ts`).

## Vérifier le code

```bash
npm run typecheck
```

## À faire (suite du projet)

- [ ] Intégrer les maquettes Figma (thème, icônes, écrans)
- [ ] Mode hors connexion : enregistrer le signalement et l'envoyer au retour du réseau
- [ ] Rédaction d'une alerte depuis l'espace autorités (aujourd'hui : publication des propositions, création via l'API)
- [ ] Choix de la destination par recherche d'adresse pour l'itinéraire sûr
- [ ] Langues locales pour les alertes vocales
