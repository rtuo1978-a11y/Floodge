# Comment contribuer

## Les branches

```
main                    ← version stable, démontrable (protégée)
 ├── frontend-mobile    ← mobile/
 ├── backend            ← backend/
 ├── ia                 ← ia/
 └── cartographie-donnees ← cartographie/
```

- Chaque membre travaille **sur la branche de sa partie**, ou sur une sous-branche créée à partir d'elle :
  `git checkout backend && git checkout -b backend/alertes-push`
- Quand une fonctionnalité marche, on ouvre une **Pull Request** vers la branche de la partie, puis, quand la partie est stable, de la branche de la partie vers `main`.
- On ne pousse jamais directement sur `main`.

## Récupérer le travail des autres

```bash
git fetch origin
git checkout backend
git pull origin backend
```

Pour tester tout le projet ensemble en local, il suffit d'avoir les quatre branches dans quatre dossiers :

```bash
git worktree add ../flowmanage-backend backend
git worktree add ../flowmanage-mobile frontend-mobile
git worktree add ../flowmanage-ia ia
git worktree add ../flowmanage-carto cartographie-donnees
```

## Messages de commit

Format court, en français : `type(partie): ce qui change`

- `feat(backend): publication des alertes`
- `fix(mobile): position GPS non envoyée`
- `docs(ia): exemple de Modelfile`

Types : `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Secrets

Ne jamais pousser les fichiers `.env` (clés Supabase, Google Maps, JWT). Chaque dossier fournit un `.env.example` à copier.

## Le contrat d'API

`docs/api.md` est la référence commune. Si une route change dans le back-end, mettre ce fichier à jour dans la même Pull Request et prévenir l'équipe mobile.
