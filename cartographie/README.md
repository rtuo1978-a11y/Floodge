# FlowManage — Cartographie et données

Service Node.js qui gère la **géographie** de FlowManage :

- **Zones à risque** (GeoJSON) et localisation d'un point (zone + commune)
- **Import des données SODEXAM** (pluie, niveau d'eau) depuis un fichier CSV
- **Score de risque** par zone : risque de base + pluie observée + pluie prévue + signalements citoyens
- **Itinéraires sûrs** qui évitent les rues signalées inondées (Google Routes API)
- **Simulation de scénarios** de pluie pour les tests et la démonstration

**Node.js · TypeScript · Express · Turf.js · Google Maps Platform (Routes + Geocoding) · Open-Meteo**

## Installation

```bash
cd cartographie
npm install
cp .env.example .env     # INTERNAL_API_KEY identique à celle du back-end
npm run dev              # http://localhost:4000
```

Clé Google Maps : [console.cloud.google.com](https://console.cloud.google.com) → créer un projet → *APIs et services* → activer **Routes API** et **Geocoding API** → *Identifiants* → créer une clé API → la mettre dans `GOOGLE_MAPS_API_KEY`.
Sans clé, tout fonctionne sauf les itinéraires sûrs (réponse 503).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Lance le service (rechargement automatique) |
| `npm test` | Tests (score, import CSV, itinéraires, API) |
| `npm run zones:generer` | Régénère `data/zones-abidjan-demo.geojson` |
| `npm run zones:envoyer` | Envoie les zones au back-end (à faire une fois la base créée) |
| `npm run sodexam:importer -- <fichier.csv>` | Importe des relevés SODEXAM et les envoie au back-end |
| `npm run risque:recalculer` | Recalcule le niveau de risque de chaque zone et l'envoie au back-end |

## Routes

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/sante` | État du service |
| GET | `/zones?commune=` | Zones (GeoJSON) |
| GET | `/zones/:code` | Une zone |
| GET | `/zones/localiser?lat=&lng=` | `{ zone, commune }` |
| GET | `/stations` | Stations météo |
| GET | `/risque/simuler?code=&pluie=&prevision=&eleves=&moderes=` | Scénario simulé (démo) |
| POST 🔧 | `/sodexam/import` | CSV en texte (`text/csv`) ou `{ "csv": "..." }` |
| POST 🔧 | `/risque/recalculer` | Recalcul + envoi au back-end |
| POST 🔧 | `/itineraires/sur` | `{ origine, destination, mode?, pointsInondes[] }` |

🔧 = en-tête `x-api-key` obligatoire (appelées par le back-end).

Exemple de scénario pour la soutenance :

```
GET http://localhost:4000/risque/simuler?code=ABJ-COCODY-PALMERAIE&pluie=120&prevision=60&eleves=2
→ { "score": 91, "niveau": "TRES_ELEVE", ... }
```

## Données

```
data/
├── zones-abidjan-demo.geojson       10 zones de DÉMONSTRATION (Cocody, Attécoubé, Yopougon, Abobo…)
├── communes-abidjan.json            centres des communes (pour retrouver la commune d'un point)
├── stations.json                    stations météo (aéroport d'Abidjan + stations fictives DEMO-*)
└── exemples/sodexam-pluie-exemple.csv
```

**Format CSV attendu pour la SODEXAM** (séparateur `;` ou `,`, décimales `,` ou `.`) :

```
station_code;date_heure;pluie_mm;periode_h;niveau_eau_cm
ABJ-AEROPORT;2026-11-20 12:00;48,0;6;
```

> ⚠️ Les zones et les stations `DEMO-*` sont **fictives**. Prochaines étapes : obtenir les relevés réels de la SODEXAM, tracer les zones à partir de l'historique des inondations (2018, 2020…) et du relief, et valider les niveaux avec les autorités.

## Calcul du score de risque

`src/risque/score.ts` :

```
score = base + (100 − base) × [ 0,6 × pluie × vulnérabilité + 0,4 × signalements ]
```

- **base** : risque intrinsèque de la zone (0–100), par temps sec le score vaut la base
- **pluie** : 65 % pluie observée sur 24 h (saturation 100 mm) + 35 % pluie prévue sur 24 h (saturation 80 mm, Open-Meteo)
- **vulnérabilité** : 0,3 + 0,7 × base/100 — la même pluie inquiète plus dans un bas-fond
- **signalements** : MODERE = 1, ELEVE = 2, saturation à 6

Niveaux : < 25 FAIBLE · < 50 MODERE · < 75 ELEVE · ≥ 75 TRES_ELEVE
