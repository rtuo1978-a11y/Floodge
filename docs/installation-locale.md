# Installer et lancer Floodge en local (Windows)

Ce guide lance **toute l'application sur un seul ordinateur** : la base de données, l'API, l'IA, la cartographie et l'application mobile (sur téléphone ou dans le navigateur).

Compter environ 1 heure la première fois (téléchargements compris).

---

## 1. Installer les outils (une seule fois)

| Outil | Pour | Lien |
|---|---|---|
| **Node.js 22 LTS** | back-end, cartographie, mobile | https://nodejs.org |
| **Python 3.12 ou plus** (cocher « Add to PATH ») | service IA | https://www.python.org/downloads |
| **PostgreSQL 16** (noter le mot de passe de l'utilisateur `postgres`) | base de données | https://www.postgresql.org/download/windows |
| **Ollama** | modèle d'IA | https://ollama.com/download |
| **Expo Go** sur le téléphone | voir l'app sur téléphone | Play Store / App Store |

> PostgreSQL est différent de MySQL (XAMPP) : il faut l'installer à part. On peut aussi utiliser **Supabase** (base en ligne gratuite) à la place : voir `backend/README.md`.

Vérifier dans un terminal (PowerShell) :

```powershell
node -v        # v22...
python --version
ollama -v
```

## 2. Créer la base de données

Ouvrir **pgAdmin** (installé avec PostgreSQL) → clic droit sur *Databases* → *Create* → *Database* → nom : `floodge`.

Ou en ligne de commande :

```powershell
psql -U postgres -c "CREATE DATABASE floodge;"
```

## 3. Choisir une clé interne commune

Les services se parlent avec une clé secrète. Choisir une valeur (ex. `floodge-cle-locale-2026`) et la mettre **à l'identique** dans les trois fichiers `.env` ci-dessous (`INTERNAL_API_KEY`).

## 4. Back-end (terminal n° 1)

```powershell
cd Floodge\backend
npm install
copy .env.example .env
```

Modifier `backend\.env` :

```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/floodge"
DIRECT_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/floodge"
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=une-longue-phrase-secrete-a-changer
INTERNAL_API_KEY=floodge-cle-locale-2026
IA_URL=http://localhost:8000
CARTO_URL=http://localhost:4000
PORT=3000
PUBLIC_URL=http://localhost:3000
```

Puis créer les tables, les données de démonstration et lancer :

```powershell
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

✅ http://localhost:3000/docs affiche la documentation de l'API.

## 5. Service IA (terminal n° 2)

```powershell
cd Floodge\ia
ollama pull qwen2.5:3b
ollama create floodge -f Modelfile
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Dans `ia\.env`, mettre `INTERNAL_API_KEY=floodge-cle-locale-2026`, puis :

```powershell
uvicorn app.main:app --reload --port 8000
```

✅ http://localhost:8000/sante doit afficher `"ollamaDisponible": true`.
(Sans Ollama, le service marche quand même avec des règles simples.)

## 6. Cartographie (terminal n° 3)

```powershell
cd Floodge\cartographie
npm install
copy .env.example .env
```

Dans `cartographie\.env`, mettre `INTERNAL_API_KEY=floodge-cle-locale-2026` (et la clé Google Maps si vous en avez une), puis :

```powershell
npm run zones:envoyer
npm run sodexam:importer -- data/exemples/sodexam-pluie-exemple.csv
npm run dev
```

✅ http://localhost:4000/zones affiche les zones à risque.

## 7. Application mobile (terminal n° 4)

```powershell
cd Floodge\mobile
npm install
copy .env.example .env
```

### Option A — dans le navigateur (le plus simple pour voir le rendu)

Dans `mobile\.env` : `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`, puis :

```powershell
npm run web
```

Ouvrir http://localhost:8081 et réduire la fenêtre (ou F12 → mode téléphone) pour avoir la taille d'un écran de téléphone.
La carte y est simplifiée ; la vraie carte Google s'affiche sur téléphone.

### Option B — sur le téléphone

1. Trouver l'adresse IP de l'ordinateur : `ipconfig` → *Adresse IPv4* (ex. `192.168.1.20`).
2. Dans `mobile\.env` : `EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1`
3. `npx expo start`, puis scanner le QR code avec **Expo Go**. Téléphone et ordinateur sur le **même Wi-Fi**.
4. Si le téléphone n'arrive pas à joindre l'API : autoriser Node.js dans le pare-feu Windows (réseau privé).

## 8. Se connecter

Mot de passe pour tous les comptes : **`Floodge2026!`**

| Compte | Ce qu'on peut tester |
|---|---|
| `citoyen1@floodge.ci` | carte, signalement, alertes vocales, conseils, SOS, badges |
| `citoyen2@floodge.ci`, `citoyen3@floodge.ci` | confirmer les signalements des autres |
| `autorite@floodge.ci` | Profil → *Espace autorités* : publier les alertes, vérifier les signalements |
| `secours@floodge.ci` | Profil → *Espace secours* : prendre en charge les SOS |

## Scénario de démonstration

1. Avec 3 comptes citoyens différents, signaler de l'eau (niveau *Modéré* ou *Élevé*) au même endroit.
2. Le moteur de règles propose une alerte : se connecter en `autorite@floodge.ci` → *Espace autorités* → **Publier**.
3. Avec un compte citoyen : onglet **Alertes** → l'alerte apparaît et peut être **écoutée**.
4. Appuyer sur **SOS** → se connecter en `secours@floodge.ci` → *Espace secours* → **Prendre en charge**.
5. Simuler un épisode de pluie : http://localhost:4000/risque/simuler?code=ABJ-COCODY-PALMERAIE&pluie=120&prevision=60&eleves=2

## Problèmes fréquents

| Problème | Solution |
|---|---|
| `npm install` échoue sur des conflits de versions | Les fichiers `.npmrc` règlent déjà ce cas ; sinon `npm install --legacy-peer-deps` |
| `prisma migrate` : erreur d'authentification | Vérifier le mot de passe PostgreSQL dans `DATABASE_URL` et `DIRECT_URL` |
| L'app affiche « Serveur injoignable » | Vérifier que le back-end tourne et que `EXPO_PUBLIC_API_URL` est correct, puis relancer `npx expo start -c` |
| `.venv\Scripts\activate` refusé | PowerShell : `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Itinéraire sûr : « GOOGLE_MAPS_API_KEY non configurée » | Normal sans clé Google : voir `cartographie/README.md` |
