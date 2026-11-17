# Design system FlowManage

**Style : « accessible et rassurant ».** FlowManage s'adresse à tout le monde, y compris sous la pluie, au soleil, avec un petit téléphone ou dans l'urgence. La lisibilité et le contraste passent avant les effets.

Code : jetons dans `src/theme.ts`, composants dans `src/components/ui.tsx`, animations dans `src/components/anim.tsx`, logo dans `src/components/Logo.tsx` (`Logo`, `NomMarque`, `LogoComplet`), retours haptiques dans `src/lib/haptique.ts`.

Logo et règles de placement : `docs/marque/README.md` (branche `main`).

## Principes

1. **Le bleu rassure, le rouge alerte.** Le bleu de l'eau est la couleur de la marque. Le rouge est **réservé** au danger et au SOS : on ne l'utilise jamais pour décorer.
2. **Jamais la couleur seule.** Un niveau (inondation, risque, alerte, statut) est toujours affiché avec **une icône et un texte** (`PastilleNiveau`), pour les daltoniens et les écrans abîmés.
3. **Une action principale par écran**, en bouton plein. Les actions secondaires sont en contour ou fantôme.
4. **Zones tactiles ≥ 48 px**, espacées d'au moins 8 px.
5. **Aucune valeur en dur** dans les écrans : couleurs, tailles, espacements et rayons passent par `theme.ts`.
6. **Aucun emoji comme icône** : icônes vectorielles [Lucide](https://lucide.dev), trait de 2 px.

## Jetons

### Couleurs sémantiques

| Jeton | Valeur | Usage |
|---|---|---|
| `primaire` | `#0369A1` | Boutons principaux, liens, éléments actifs |
| `primaireFonce` | `#0C4A6E` | Texte sur fond bleu clair, état actif de l'onglet Signaler |
| `primairePresse` | `#075985` | Bouton principal appuyé |
| `primaireDoux` | `#E0F2FE` | Boutons secondaires, fonds d'icônes |
| `primaireTresDoux` | `#F0F9FF` | Ligne appuyée, ligne « vous » du classement |
| `fond` | `#F4F8FB` | Fond des écrans |
| `surface` | `#FFFFFF` | Cartes, panneaux, champs |
| `surfaceAlt` | `#EEF2F6` | Segments, squelettes, bouton désactivé |
| `bordure` / `bordureForte` | `#E2E8F0` / `#CBD5E1` | Bordures de cartes / de boutons contour |
| `texte` | `#0F172A` | Texte principal |
| `texteSecondaire` | `#475569` | Méta-informations, aides |
| `texteDesactive` | `#64748B` | Placeholders, libellés désactivés |
| `sos` / `sosPresse` / `sosDoux` | `#DC2626` / `#B91C1C` / `#FEE2E2` | Bouton SOS, prise en charge secours |
| `succes` / `erreur` | `#15803D` / `#B91C1C` | Messages de retour |
| `voileClair` / `voileClairFort` | blanc 12 % / 18 % | Zones posées sur fond bleu ou rouge (statistiques, icônes) |
| `or` / `orDoux` · `argent` · `bronze` | `#A16207` / `#FEF9C3` · `#475569` · `#9A3412` | Badge Meilleur citoyen, podium du classement (or sur orDoux : 4,6) |

### Niveaux

| Niveau | Couleur | Fond doux | Icône (Lucide) |
|---|---|---|---|
| Inondation faible · Risque faible | `faible #15803D` | `#F0FDF4` | `Droplet` · `ShieldCheck` |
| Inondation modérée · Risque modéré · Vigilance | `modere #B45309` | `#FEF3C7` | `Car` · `CircleExclamationPoint` |
| Inondation élevée · Risque élevé · Danger | `eleve #B91C1C` | `#FEF2F2` | `WavesHorizontal` · `TriangleExclamationPoint` |
| Risque très élevé | `tresEleve #7F1D1D` | `#FEE2E2` | `OctagonExclamationPoint` |
| Information | `info #0369A1` | `#E0F2FE` | `Info` |

### Contrastes vérifiés (WCAG 2.1 AA, texte normal ≥ 4,5:1)

| Paire | Ratio |
|---|---|
| `texte` sur `fond` | 16,7 |
| `texteSecondaire` sur `surface` / `fond` | 7,6 / 7,1 |
| blanc sur `primaire` | 5,9 |
| blanc sur `sos` | 4,8 |
| `faible` / `modere` / `eleve` / `tresEleve` sur leur fond doux | 4,8 / 4,5 / 5,9 / 8,2 |
| `primaireDoux` sur `primaire` (sous-titres sur bleu) | 5,2 |

### Typographie

| Jeton | Police | Taille / interligne | Usage |
|---|---|---|---|
| `affiche` | Lexend Bold | 32 / 40 | Nom de l'app, bouton SOS |
| `titre1` | Lexend Bold | 26 / 34 | Titre d'écran, statistiques |
| `titre2` | Lexend SemiBold | 20 / 28 | Titre de carte importante |
| `titre3` | Lexend SemiBold | 17 / 24 | Titre de section, de carte |
| `corps` / `corpsGras` | Atkinson Hyperlegible | 16 / 24 | Texte courant (jamais moins de 16) |
| `petit` / `petitGras` | Atkinson Hyperlegible | 14 / 20 | Méta-informations, aides |
| `legende` | Atkinson Hyperlegible Bold | 12 / 16, +0,4 | Pastilles (en majuscules) |
| `bouton` | Lexend SemiBold | 16 / 22 | Libellés de boutons |

**Pourquoi ces polices ?** *Atkinson Hyperlegible* a été conçue pour les personnes malvoyantes : chaque lettre et chaque chiffre est distinct (le zéro barré évite la confusion avec la lettre O dans les numéros et les distances). *Lexend* a été conçue pour réduire l'effort de lecture. Les deux sont gratuites (Google Fonts) et embarquées dans l'app (`@expo-google-fonts`).

### Espacements, rayons, tailles, ombres, mouvement

| Famille | Jetons |
|---|---|
| `espace` | xxs 2 · xs 4 · s 8 · sm 12 · m 16 · l 24 · xl 32 · xxl 48 |
| `rayon` | s 8 · m 12 · l 16 · xl 24 · rond 999 |
| `taille` | cible 48 · bouton 52 · boutonPetit 44 · icônes 16 / 20 / 24 / 32 · sos 168 |
| `ombre` | faible (cartes flottantes) · moyenne (en-têtes, panneaux) · forte (SOS, panneau de carte) |
| `duree` | rapide 120 ms (appui) · normale 200 ms · lente 320 ms |

## Composants

| Composant | Variantes / props | États | Accessibilité |
|---|---|---|---|
| `Texte` | `variante` (jeton typo), `couleur` | — | Hérite de `Text` ; `accessibilityRole="header"` pour les titres |
| `Ecran` | `titre`, `sousTitre`, `action`, `onRafraichir`, `enTeteSysteme` | Tirer pour rafraîchir | Titre annoncé comme en-tête ; zones sûres respectées |
| `Bouton` | `primaire`, `secondaire`, `contour`, `danger`, `fantome` · `petit` · `icone` | Défaut, appuyé (couleur + échelle 0,98), désactivé (gris), chargement (indicateur) | `role=button`, `disabled`, `busy` ; libellé lu par le lecteur d'écran |
| `BoutonIcone` | `surface`, `primaire`, `transparent` | Appuyé (opacité 0,75) | 48×48, **libellé obligatoire** |
| `Champ` | `libelle`, `aide`, `erreur`, `icone`, `multiline` | Défaut, focus (bordure bleue 2 px), erreur (bordure + message rouge) | Libellé visible au-dessus (jamais seulement un placeholder), erreur annoncée |
| `Carte` | `accent` (liseré de niveau), `onPress` | Appuyée (fond bleu très clair) | `role=button` si cliquable |
| `Pastille` / `PastilleNiveau` | `couleur`, `fond`, `icone` | — | Icône + texte : jamais la couleur seule |
| `Bandeau` | `info`, `succes`, `erreur`, `vigilance` · `titre`, `icone` | — | Région « live » : annoncée quand elle apparaît |
| `Segments` | `options`, `valeur` | Actif (fond blanc + ombre) | `role=tablist` / `tab`, état `selected` |
| `EtatVide` | `icone`, `titre`, `texte`, `action` | — | — |
| `Squelette` | `hauteur` | Pulsation (désactivée si « réduire les animations ») | Libellé « Chargement » |
| `Avatar` | `nom`, `taille` | — | Masqué (le nom est déjà affiché à côté) |
| `LigneListe` | `icone`, `titre`, `sousTitre`, `droite` | Appuyée | `role=button`, libellé = titre |
| `Logo` | `taille`, `inverse` | — | Libellé « Logo FlowManage » |

### À faire / à ne pas faire

| ✅ À faire | ❌ À éviter |
|---|---|
| `couleurs.eleve` pour un niveau ÉLEVÉ, avec `PastilleNiveau` | `'#ff0000'` dans un écran |
| Un seul bouton `primaire` par écran (ou `danger` pour le SOS) | Deux boutons pleins côte à côte de même poids |
| Icône Lucide + libellé | Emoji comme icône |
| `Champ` avec `libelle` visible | Placeholder comme seul libellé |
| `BoutonIcone` avec `libelle` | Icône cliquable sans nom accessible |

## Interactions

| Interaction | Où | Détail |
|---|---|---|
| Apparition en cascade | listes (alertes, conseils, badges, autorités, secours) | `Apparition` : fondu + glissement de 12 px, 320 ms, décalage de 60 ms par élément (8 max) |
| Rebond | icône de succès, illustrations de bienvenue | `Rebond` : ressort (friction 4, tension 120) |
| Progression | objectif de badge (profil) | `BarreProgression` : 700 ms, rôle `progressbar` |
| Maintien | bouton SOS | 1,5 s d'appui, remplissage rouge foncé ; double toucher avec lecteur d'écran |
| Filtres | carte (signalements + 4 niveaux de risque), alertes (Toutes / Danger / Vigilance / Info) | puces `checkbox`, segments `tab` |
| Pages glissées | bienvenue (3 pages) | points de pagination animés, « Passer » toujours visible |
| Haptique | sélection d'un niveau, d'un filtre, envoi réussi, erreur, SOS | `haptique.selection / appui / succes / erreur / fort` (sans effet dans le navigateur) |

Toutes les animations passent par `useMouvementReduit()` : avec « Réduire les animations », l'état final s'affiche directement.

## Suite

- **Mode sombre** : les jetons sémantiques sont prêts ; il reste à définir la palette sombre et à tester les contrastes séparément.
- **Taille de texte du système** : vérifier les écrans avec la plus grande taille de police Android/iOS.
- **Figma** : reporter ces jetons dans une bibliothèque Figma (styles de couleur et de texte du même nom) pour que maquettes et code restent alignés.
