# Floodge — Back-end

API principale de Floodge : comptes, signalements, alertes, secours, conseils, badges, zones à risque.
**NestJS 12 · Prisma 7 · Supabase (PostgreSQL + Storage) · notifications push Expo**

## Installation

```bash
cd backend
npm install            # génère aussi le client Prisma (postinstall)
cp .env.example .env   # puis remplir les valeurs Supabase
```

### Créer la base sur Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région la plus proche : `eu-west`).
2. *Project Settings → Database* : copier les URL **Transaction pooler** (`DATABASE_URL`) et **Direct connection** (`DIRECT_URL`) dans `.env`.
3. *Storage* : créer un bucket **public** nommé `photos`, puis copier `SUPABASE_URL` et la clé `service_role` dans `.env`.
4. Créer les tables et les données de démonstration :

```bash
npm run prisma:migrate -- --name init   # crée prisma/migrations/ — à committer
npm run seed
```

> Pas de Supabase sous la main ? Une base PostgreSQL locale marche aussi : mettre la même URL dans `DATABASE_URL` et `DIRECT_URL`.

## Lancer

```bash
npm run start:dev
```

- API : http://localhost:3000/api/v1
- Documentation interactive (Swagger) : http://localhost:3000/docs
- Pour tester depuis le téléphone, utiliser l'IP de l'ordinateur sur le Wi-Fi (ex. `http://192.168.1.20:3000/api/v1`).

Comptes de démonstration (mot de passe `Floodge2026!`) :

| E-mail | Rôle |
|---|---|
| admin@floodge.ci | ADMIN |
| autorite@floodge.ci | AUTORITE (publie les alertes) |
| secours@floodge.ci | SECOURISTE |
| citoyen1@floodge.ci … citoyen3@floodge.ci | CITOYEN |

## Tests

```bash
npm test          # moteur de règles, barème des badges, géographie
```

## Organisation du code

```
src/
├── auth/             inscription, connexion (JWT)
├── utilisateurs/     profil, jeton push, rôles (admin)
├── signalements/     signalement citoyen, photo, confirmation, vérification
├── regles/           moteur de règles → alerte proposée automatiquement
├── alertes/          brouillon → publication → notification push + texte vocal
├── secours/          bouton SOS, prise en charge par les secouristes
├── conseils/         conseils avant/pendant/après + conseils IA + assistant
├── badges/           points, badges, classement, « Meilleur citoyen du mois » (tâche mensuelle)
├── carte/            zones GeoJSON, météo SODEXAM, itinéraire sûr, routes internes
├── integrations/     clients IA et cartographie, notifications Expo, stockage photos
├── common/           garde d'authentification, décorateurs, calculs géographiques
└── prisma/           connexion à la base
prisma/
├── schema.prisma     modèle de données
└── seed.ts           données de démonstration
```

## Fonctionnement clé

**Signalement → alerte**
1. Un citoyen envoie un signalement (position, niveau, description, photo).
2. Le back-end retrouve la commune et la zone à risque (service cartographie, sinon zones de la base).
3. Le service IA analyse la description en arrière-plan (gravité, crédibilité, résumé).
4. Le moteur de règles (`src/regles/regles.ts`) vérifie : **≥ 3 personnes différentes à moins de 500 m en 2 h** (auteurs + confirmations, niveaux MODERE/ELEVE) → une alerte **brouillon** est créée et les autorités sont notifiées.
5. Une autorité vérifie puis **publie** : le texte vocal est généré par l'IA, la notification push part vers les habitants de la zone.

**Points citoyens** (`src/badges/bareme.ts`) : signalement +5, confirmé par une autorité +20, rejeté −10, confirmation d'un autre signalement +2.
Le 1er de chaque mois, le premier du classement reçoit le badge **Meilleur citoyen du mois**.

## Routes internes

Les services `ia/` et `cartographie/` appellent `/api/v1/interne/...` avec l'en-tête `x-api-key: <INTERNAL_API_KEY>` :

- `POST /interne/zones/import` — zones à risque (GeoJSON)
- `PATCH /interne/zones/:code/risque` — nouveau niveau / score calculé
- `POST /interne/meteo/observations` — observations SODEXAM
- `GET /interne/signalements/recents?heures=12` — points inondés récents

La liste complète des routes est dans [`docs/api.md`](https://github.com/rtuo1978-a11y/Floodge/blob/main/docs/api.md) (branche `main`).
