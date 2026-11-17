# FlowManage — Intelligence artificielle

Service IA de FlowManage, basé sur un **modèle Ollama personnalisé** (`flowmanage`). Il est appelé uniquement par le back-end.

| Route | Rôle | Utilisé par le back-end quand… |
|---|---|---|
| `POST /analyse-signalement` | Gravité estimée, crédibilité, résumé, besoin de secours | un citoyen envoie un signalement |
| `POST /texte-vocal` | Texte court lu à voix haute sur le téléphone | une autorité publie une alerte |
| `POST /conseils` | 3 à 5 conseils adaptés à la situation décrite | l'utilisateur demande des conseils personnalisés |
| `POST /chat` | Assistant conversationnel | l'utilisateur discute avec l'assistant |
| `GET /sante` | État du service et d'Ollama | — |

**Python · FastAPI · Ollama (qwen2.5:3b personnalisé)**

Si Ollama ne répond pas, chaque route bascule sur des **règles de repli** (`app/repli.py`) : l'application fonctionne toujours, avec `"source": "regles"` dans la réponse.

## Installation

1. Installer [Ollama](https://ollama.com/download), puis créer le modèle FlowManage :

   ```bash
   cd ia
   ollama pull qwen2.5:3b
   ollama create flowmanage -f Modelfile
   ollama run flowmanage "Il pleut fort à Abobo, l'eau arrive aux genoux"
   ```

2. Installer et lancer le service :

   ```bash
   python -m venv .venv
   # Windows : .venv\Scripts\activate    —    Linux/Mac : source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env          # INTERNAL_API_KEY identique à celle du back-end
   uvicorn app.main:app --reload --port 8000
   ```

   Documentation interactive : http://localhost:8000/docs

3. Tests :

   ```bash
   pytest
   ```

## Organisation

```
ia/
├── Modelfile                 modèle "flowmanage" : base qwen2.5:3b + rôle + règles de sécurité
├── app/
│   ├── main.py               routes FastAPI
│   ├── prompts.py            consignes par tâche (analyse, texte vocal, conseils)
│   ├── ollama.py             appel à l'API Ollama (sorties JSON structurées)
│   ├── repli.py              règles utilisées si Ollama est indisponible
│   └── schemas.py            formats d'entrée / sortie
├── entrainement/             fine-tuning : données, script Colab, Modelfile du modèle entraîné
└── tests/
```

## Garde-fous

- L'IA **ne publie jamais d'alerte** : elle analyse et propose, une autorité valide dans le back-end.
- Si les règles détectent un besoin de secours (« bloqué », « enfant », « sur le toit »…), le résultat `besoinSecours` reste à `true` même si le modèle l'a manqué.
- Les numéros d'urgence et l'interdiction d'inventer des informations officielles sont dans le `SYSTEM` du Modelfile.

## Pistes d'amélioration

- Enrichir `entrainement/donnees/` puis fine-tuner (voir `entrainement/README.md`).
- Analyse de la photo du signalement avec un modèle de vision (`llava`, `qwen2.5vl`) pour vérifier la présence d'eau.
- Niveau 3 de l'intelligence : prévision du risque à partir de l'historique pluie / inondations (quand les données SODEXAM seront suffisantes).
