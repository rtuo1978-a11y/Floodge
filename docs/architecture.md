# Architecture de FlowManage

```
                ┌──────────────────────────────────────────┐
                │      Application mobile (mobile/)         │
                │  React Native + Expo + Google Maps        │
                │  Carte · Signaler · Alertes (vocales)     │
                │  Conseils · SOS · Profil / badges         │
                └───────────────────┬──────────────────────┘
                                    │ HTTPS  /api/v1  (JWT)
                ┌───────────────────▼──────────────────────┐
                │          API principale (backend/)        │
                │   NestJS + Prisma → Supabase PostgreSQL   │
                │   + Supabase Storage (photos)             │
                │   Moteur de règles · Notifications push   │
                └──────┬──────────────────────────┬────────┘
       HTTP interne    │                          │   HTTP interne
   (clé INTERNAL_API_KEY)                         │
┌──────────────────────▼─────────┐   ┌────────────▼────────────────────┐
│   Service IA (ia/)             │   │ Service cartographie            │
│   FastAPI → Ollama "flowmanage"   │   │ (cartographie/) Node.js         │
│   conseils · analyse ·         │   │ zones GeoJSON · SODEXAM ·       │
│   texte d'alerte vocale        │   │ score de risque · itinéraires   │
└────────────────────────────────┘   │ sûrs (Google Directions)        │
                                     └─────────────────────────────────┘
```

## Principes

1. **Le mobile ne parle qu'au back-end.** Le back-end sert de passerelle vers les services IA et cartographie (`/api/v1/ia/...`, `/api/v1/carte/...`). On n'expose ni Ollama ni les clés Google côté serveur au public.
2. **Une seule base de données**, gérée par le back-end (Prisma). Le service cartographie envoie ses résultats (zones, observations SODEXAM, niveaux de risque) au back-end par les routes `/api/v1/interne/...`, protégées par l'en-tête `x-api-key`.
3. **Chaque service fonctionne seul** avec des données de démonstration, pour que chaque membre de l'équipe puisse avancer sans attendre les autres.
4. **Validation humaine des alertes** : le moteur de règles et l'IA *proposent* (alerte en brouillon), une autorité *publie*.

## Modèle de données (résumé)

| Table | Contenu |
|---|---|
| `User` | nom, email, téléphone, rôle (`CITOYEN`, `SECOURISTE`, `AUTORITE`, `ADMIN`), commune, points, jeton push |
| `Signalement` | position, niveau (`FAIBLE`, `MODERE`, `ELEVE`), description, photo, statut, analyse IA |
| `Confirmation` | un citoyen confirme le signalement d'un autre (« je vois aussi l'eau ») |
| `ZoneRisque` | nom, commune, géométrie GeoJSON, niveau de risque, source, démo oui/non |
| `Alerte` | titre, message, texte vocal, niveau, type (`PREVENTION`, `INONDATION`, `SECOURS`), statut, zone, origine (manuelle/automatique) |
| `DemandeSecours` | SOS : position, nombre de personnes, statut, secouriste assigné |
| `ObservationMeteo` | données de station (SODEXAM ou autre) : pluie, niveau d'eau, date |
| `Conseil` | conseils avant / pendant / après une inondation |
| `Badge`, `BadgeUtilisateur` | badges dont « Meilleur citoyen du mois » |

Le schéma complet est dans `backend/prisma/schema.prisma` (branche `backend`).

## « Intelligence » de l'application

| Niveau | Où | Ce qui est fait |
|---|---|---|
| 1 — Règles | backend `regles/` | ≥ 3 signalements `MODERE`/`ELEVE` à moins de 500 m en 2 h → alerte **brouillon** + notification aux autorités |
| 1 bis — IA | ia/ | Analyse de chaque signalement (gravité estimée, crédibilité, résumé), conseils personnalisés, texte court pour l'alerte vocale |
| 2 — Tendances | cartographie `risque/` | Score de risque par zone : risque de base + pluie SODEXAM 24 h + prévision + signalements récents |
| 3 — Prévision | à venir | Modèle entraîné sur l'historique pluie / inondations quand les données seront suffisantes |

## Ports par défaut (local)

| Service | Port |
|---|---|
| backend | 3000 (Swagger : `/docs`) |
| cartographie | 4000 |
| ia | 8000 (Swagger : `/docs`) |
| Ollama | 11434 |
