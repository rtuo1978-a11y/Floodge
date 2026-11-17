# Entraîner le modèle FlowManage

Il y a deux niveaux de personnalisation, à faire dans cet ordre.

## 1. Personnalisation par Modelfile (déjà en place)

Le fichier `ia/Modelfile` part d'un modèle existant (`qwen2.5:3b`) et lui donne un **rôle**, des **règles de sécurité** et un ton (bloc `SYSTEM`). C'est rapide, sans GPU, et suffit pour la démonstration :

```bash
ollama pull qwen2.5:3b
ollama create flowmanage -f Modelfile
ollama run flowmanage "L'eau monte devant chez moi à Yopougon, je fais quoi ?"
```

## 2. Fine-tuning (LoRA) sur nos propres exemples

But : que le modèle réponde exactement au format attendu (JSON d'analyse, texte vocal court) et connaisse le vocabulaire local (gbaka, woro-woro, bas-fonds, noms de quartiers).

1. **Enrichir les données** : `donnees/flowmanage-instructions.jsonl` contient 23 exemples de départ (analyses, textes vocaux, conseils, questions). Il en faut **au moins 200 à 300** pour un effet visible. Une ligne = une conversation :
   ```json
   {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
   ```
   Pour les tâches d'analyse, de texte vocal et de conseils, reprendre exactement les consignes de `app/prompts.py`.
   Varier : communes, niveaux d'eau, descriptions vagues ou fausses, cas où il faut des secours, fautes d'orthographe, nouchi.
2. **Entraîner sur Google Colab** (GPU T4 gratuit) avec `finetune_unsloth.py` — instructions en tête du fichier (≈ 15 min pour 300 exemples).
3. **Installer le modèle** : copier le `.gguf` obtenu dans ce dossier, adapter le nom dans `Modelfile.finetune`, puis :
   ```bash
   ollama create flowmanage -f entrainement/Modelfile.finetune
   ```
4. **Comparer** avant/après sur des exemples qui ne sont pas dans les données d'entraînement (garder 10 à 20 % des exemples de côté pour ce test).

## Règles pour les données

- Aucune donnée personnelle réelle (noms, numéros de téléphone, adresses précises).
- Les numéros d'urgence doivent être exacts : sapeurs-pompiers **180**, SAMU **185**, police **110 / 111 / 170**.
- Le modèle ne doit jamais inventer une alerte ou une prévision : inclure des exemples où il répond « je ne sais pas, consultez la SODEXAM ».
