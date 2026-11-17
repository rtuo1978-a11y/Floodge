<p align="center"><img src="docs/marque/flowmanage-horizontal.png" alt="FlowManage" width="420"></p>

# FlowManage

> **Anticiper, alerter, protéger.**
> Application mobile de prévention et de gestion des risques d'inondation en Côte d'Ivoire — Projet APP3.

FlowManage permet aux habitants de **signaler une inondation** (photo + position GPS), de **consulter une carte des zones à risque** alimentée par les données météo (SODEXAM), de **recevoir des alertes** (écrites et **vocales**), d'obtenir des **conseils** adaptés à leur situation, de déclencher une **alerte secours (SOS)**, et récompense les citoyens les plus actifs par un **badge « Meilleur citoyen »**. Les autorités et les équipes de secours disposent d'un espace pour vérifier les signalements, publier les alertes officielles et suivre les interventions.

---

## Organisation du dépôt

Le dépôt est un **monorepo** : chaque partie du projet a son dossier **et sa branche de travail**.

| Branche | Dossier | Rôle | Technologies |
|---|---|---|---|
| `main` | `docs/` | Documentation, architecture, contrat d'API, planning | Markdown |
| `frontend-mobile` | `mobile/` | Application mobile citoyen / secours | React Native, Expo, expo-router, Google Maps |
| `backend` | `backend/` | API principale, base de données, alertes, notifications | NestJS, Prisma, Supabase (PostgreSQL) |
| `ia` | `ia/` | Assistant IA : conseils, analyse des signalements, texte des alertes vocales | Ollama (modèle personnalisé), Python, FastAPI |
| `cartographie-donnees` | `cartographie/` | Zones à risque, import des données SODEXAM, calcul du risque, itinéraires sûrs | Node.js, TypeScript, Google Maps APIs, Turf.js |

L'identité visuelle (logo, règles de placement) est dans [`docs/marque/`](docs/marque/README.md) et le design system de l'application dans `mobile/design/` (branche `frontend-mobile`). Les maquettes Figma de l'équipe UI/UX restent hors du dépôt.

## Démarrage rapide

```bash
git clone https://github.com/rtuo1978-a11y/Floodge.git FlowManage   # le dépôt GitHub s'appelle encore « Floodge »
cd FlowManage
git checkout backend            # ou frontend-mobile, ia, cartographie-donnees
```

Chaque dossier contient son propre `README.md` avec l'installation et les commandes.

Ordre conseillé pour lancer tout le projet en local :

1. **backend** (port `3000`) — base Supabase + `npx prisma migrate dev` + `npm run seed`
2. **ia** (port `8000`) — Ollama + `ollama create flowmanage -f Modelfile`
3. **cartographie** (port `4000`)
4. **mobile** — `npx expo start`, avec l'adresse IP du backend dans `.env`

## Documentation

- **[Installer et lancer tout le projet en local](docs/installation-locale.md)**
- [Logo et règles de placement](docs/marque/README.md)
- [Architecture](docs/architecture.md)
- [Contrat d'API](docs/api.md) — la référence commune entre le mobile et le back-end
- [Planning (10/11 → 15/12/2026)](docs/planning.md)
- [Comment contribuer (branches, commits, pull requests)](docs/contribuer.md)

## Équipe

| Rôle | Responsable |
|---|---|
| Chef de projet | _à compléter_ |
| Front-end (React Native / Expo) | _à compléter_ |
| Back-end (NestJS / Supabase / Prisma) | _à compléter_ |
| Responsable IA (Ollama) | _à compléter_ |
| Cartographie et données (Node.js / Google Maps) | _à compléter_ |
| UI/UX (Figma) | _à compléter_ |

> ⚠️ Les zones à risque et les mesures fournies sont des **données de démonstration**. Une alerte destinée à protéger des vies doit s'appuyer sur des informations vérifiées (SODEXAM, autorités) : dans FlowManage, aucune alerte officielle n'est publiée sans validation humaine.
