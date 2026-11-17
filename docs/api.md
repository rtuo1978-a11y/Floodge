# Contrat d'API FlowManage — v1

Base : `http://<serveur>:3000/api/v1` · Documentation interactive : `http://<serveur>:3000/docs`

Authentification : en-tête `Authorization: Bearer <accessToken>` (obtenu à la connexion).
🔓 = public · 🔑 = connecté · 👮 = rôle requis · 🔧 = interne (`x-api-key`)

Les erreurs ont toujours la forme `{ "statusCode": 400, "message": "..." | ["..."], "error": "Bad Request" }`.

## Auth et profil

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| POST | `/auth/inscription` | 🔓 | `{ nom, email, motDePasse (≥8), telephone?, commune? }` | `{ accessToken, user }` |
| POST | `/auth/connexion` | 🔓 | `{ email, motDePasse }` | `{ accessToken, user }` |
| GET | `/utilisateurs/moi` | 🔑 | — | profil + `points` + `badges[]` |
| PATCH | `/utilisateurs/moi` | 🔑 | `{ nom?, telephone?, commune?, pushToken?, latitude?, longitude? }` | profil |
| GET | `/utilisateurs` | 👮 ADMIN | — | liste |
| PATCH | `/utilisateurs/:id/role` | 👮 ADMIN | `{ role: CITOYEN \| SECOURISTE \| AUTORITE \| ADMIN }` | profil |

## Signalements

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| POST | `/signalements/photo` | 🔑 | multipart, champ `photo` (JPEG/PNG/WebP ≤ 8 Mo) | `{ url }` |
| POST | `/signalements` | 🔑 | `{ latitude, longitude, niveau: FAIBLE\|MODERE\|ELEVE, description, photoUrl?, commune? }` | signalement |
| GET | `/signalements` | 🔓 | `?heures=48&statut=&commune=&lat=&lng=&rayonKm=` | liste (avec `auteur.nom`, `_count.confirmations`) |
| GET | `/signalements/miens` | 🔑 | — | liste |
| GET | `/signalements/:id` | 🔓 | — | signalement + zone |
| POST | `/signalements/:id/confirmer` | 🔑 | — | signalement (« je vois aussi l'eau ») |
| PATCH | `/signalements/:id/statut` | 👮 AUTORITE, ADMIN, SECOURISTE | `{ statut: CONFIRME\|REJETE\|RESOLU }` | signalement |

Exemple de signalement renvoyé :

```json
{
  "id": "c127…",
  "latitude": 5.3705, "longitude": -3.9625,
  "commune": "Cocody", "zoneId": "6f8d…",
  "niveau": "ELEVE", "statut": "EN_ATTENTE",
  "description": "La route est recouverte d'eau",
  "photoUrl": "https://…/photos/signalements/2026-11-20/….jpg",
  "analyseIa": { "graviteEstimee": "ELEVE", "credibilite": 0.8, "resume": "…", "besoinSecours": false },
  "auteur": { "id": "…", "nom": "Awa Koné" },
  "_count": { "confirmations": 2 },
  "createdAt": "2026-11-20T15:00:00.000Z"
}
```

## Alertes

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| GET | `/alertes` | 🔓 | `?lat=&lng=` (tri par distance, ajoute `distanceKm`) `&commune=` | alertes publiées en cours |
| GET | `/alertes/:id` | 🔓 | — | alerte |
| GET | `/alertes/brouillons` | 👮 AUTORITE, ADMIN | — | alertes à valider (dont celles du moteur de règles, `origine: AUTOMATIQUE`) |
| POST | `/alertes` | 👮 AUTORITE, ADMIN | `{ titre, message, niveau: INFO\|VIGILANCE\|DANGER, type?, texteVocal?, zoneId?, commune?, latitude?, longitude?, rayonKm?, expireLe?, publier? }` | alerte |
| PATCH | `/alertes/:id/publier` | 👮 AUTORITE, ADMIN | — | alerte + `destinataires` |
| PATCH | `/alertes/:id/archiver` | 👮 AUTORITE, ADMIN | — | alerte |

**Notification push reçue par le mobile** (`data`) :
`{ "type": "alerte", "alerteId": "…", "niveau": "DANGER", "texteVocal": "Alerte FlowManage. …" }` → l'application lit `texteVocal` à voix haute.
Autres types : `alerte_a_verifier` (autorités), `secours` (secouristes).

## Secours (SOS)

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| POST | `/secours` | 🔑 | `{ latitude, longitude, nbPersonnes?, description?, telephone? }` | demande |
| GET | `/secours/miennes` | 🔑 | — | mes demandes |
| GET | `/secours` | 👮 SECOURISTE, AUTORITE, ADMIN | `?statut=` | demandes en cours |
| PATCH | `/secours/:id` | 🔑 | `{ statut: PRISE_EN_CHARGE\|TERMINEE\|EN_ATTENTE\|ANNULEE }` | demande (le demandeur peut seulement annuler) |

## Carte, zones et météo

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| GET | `/zones` | 🔓 | `?commune=` | GeoJSON `FeatureCollection` (propriétés : `code, nom, commune, niveau, score, source, estDemo`) |
| GET | `/carte/localiser` | 🔓 | `?latitude=&longitude=` | `{ zone, commune }` |
| POST | `/carte/itineraire-sur` | 🔓 | `{ origine: {latitude, longitude}, destination: {…}, mode?: driving\|walking }` | itinéraires avec `sur: true/false` et points inondés évités |
| GET | `/meteo/observations` | 🔓 | `?heures=24` | observations SODEXAM |

## Conseils et IA

| Méthode | Route | Accès | Corps / paramètres | Réponse |
|---|---|---|---|---|
| GET | `/conseils` | 🔓 | `?moment=AVANT\|PENDANT\|APRES` | conseils de référence |
| POST | `/conseils/personnalises` | 🔑 | `{ situation, commune?, niveauRisque? }` | `{ conseils: string[], source }` |
| POST | `/ia/chat` | 🔑 | `{ messages: [{ role: user\|assistant, content }] }` | `{ reponse, source }` |

## Badges et classement

| Méthode | Route | Accès | Paramètres | Réponse |
|---|---|---|---|---|
| GET | `/badges` | 🔓 | — | liste des badges |
| GET | `/classement` | 🔓 | `?periode=2026-11` | `{ periode, classement: [{ rang, nom, commune, score, signalementsConfirmes }] }` |

## Routes internes (services ia / cartographie)

| Méthode | Route | Corps |
|---|---|---|
| POST | `/interne/zones/import` | `{ zones: [{ code, nom, commune, geometrie, niveau, score?, source, estDemo }] }` |
| PATCH | `/interne/zones/:code/risque` | `{ niveau, score, source? }` |
| POST | `/interne/meteo/observations` | `{ observations: [{ stationCode, stationNom?, latitude, longitude, pluieMm?, periodeH?, niveauEauCm?, observeLe, source? }] }` |
| GET | `/interne/signalements/recents` | `?heures=12` |

## Service IA (appelé par le back-end uniquement)

`POST /analyse-signalement`, `POST /texte-vocal`, `POST /conseils`, `POST /chat` — détails dans `ia/README.md` (branche `ia`).

## Service cartographie (appelé par le back-end uniquement)

`GET /zones`, `GET /zones/localiser`, `POST /itineraires/sur`, `POST /sodexam/import`, `POST /risque/recalculer` — détails dans `cartographie/README.md` (branche `cartographie-donnees`).
