# Handoff — interface mobile FlowManage

Spécifications des écrans de l'application mobile pour l'équipe : ce qui est affiché, dans quels états et pourquoi.
Les jetons (`primaire`, `espace.m`, `titre3`…) sont définis dans `design-system.md` et `src/theme.ts`.

## Vue d'ensemble

| Écran | Fichier | Utilisateur | Action principale |
|---|---|---|---|
| Bienvenue (1re ouverture) | `src/app/bienvenue.tsx` | tous | Commencer |
| Connexion / Inscription | `src/app/connexion.tsx`, `inscription.tsx` | tous | Se connecter |
| Carte | `src/app/(onglets)/index.tsx` | tous | Voir le risque autour de soi ; SOS |
| Alertes | `src/app/(onglets)/alertes.tsx` | tous | Écouter l'alerte |
| Signaler | `src/app/(onglets)/signaler.tsx` | tous | Envoyer le signalement |
| Conseils | `src/app/(onglets)/conseils.tsx` | tous | Lire / écouter ; demander à l'IA |
| Profil | `src/app/(onglets)/profil.tsx` | tous | Voir points, badges, classement |
| SOS | `src/app/sos.tsx` (modale) | tous | Envoyer la demande de secours |
| Détail signalement | `src/app/signalement/[id].tsx` | tous / autorités | Confirmer (« je vois aussi l'eau ») |
| Assistant | `src/app/assistant.tsx` | tous | Poser une question |
| Espace autorités | `src/app/autorite.tsx` | AUTORITE, ADMIN | Publier une alerte |
| Espace secours | `src/app/secours.tsx` | SECOURISTE, AUTORITE, ADMIN | Prendre en charge un SOS |

## Mise en page commune

- Écran : fond `fond`, marges `espace.m` (16), bas de liste `espace.xxl` (48) pour ne pas passer sous la barre d'onglets.
- Titre d'écran `titre1` + sous-titre `petit` / `texteSecondaire`, `espace.l` (24) avant le contenu.
- Cartes : `surface`, bordure 1 px `bordure`, rayon `l` (16), padding `m`, espacement vertical `sm` (12). Liseré gauche 4 px de la couleur du niveau quand la carte représente un niveau.
- Sections : `titre3`, `espace.l` au-dessus, `espace.sm` en dessous.
- Barre d'onglets : hauteur 68, 5 onglets maximum. L'onglet central **Signaler** est un bouton rond de 52 px, surélevé de 18 px, bordure blanche 4 px : c'est l'action citoyenne principale.
- Petits écrans (375 px) : textes sur plusieurs lignes autorisés, jamais de défilement horizontal sauf la légende de la carte et les suggestions de l'assistant (défilement volontaire).
- Tablette : la largeur des cartes n'est pas limitée pour l'instant (à faire : largeur max 640 px centrée).

## Écran Bienvenue

- Affiché une seule fois par téléphone, avant la connexion (`flowmanage.bienvenue` mémorisé).
- 3 pages glissées horizontalement : *Voyez le risque près de chez vous* (bleu, carte), *Signalez en 30 secondes* (ambre, plus), *Alerté à temps, secouru vite* (rouge, sirène).
- Illustration : disque de 128 px de la couleur de la page dans un cercle de 220 px, pastille secondaire, vagues décoratives. Rebond à l'arrivée sur la page.
- En haut : logo horizontal + « Passer ». En bas : points de pagination (le point actif s'allonge de 8 à 28 px) + bouton « Suivant » / « Commencer ».

## Écran Carte

| Élément | Spécification |
|---|---|
| En-tête flottant | Carte `surface`, rayon `l`, ombre moyenne, logo 36, « FlowManage » `titre3`, compteur `petit`. Bouton Actualiser (`BoutonIcone` transparent) ou indicateur de chargement à la même place (pas de saut de mise en page). |
| Bandeau d'alerte | Visible s'il existe une alerte DANGER (sinon VIGILANCE). Fond = couleur du niveau, texte blanc, icône `TriangleExclamationPoint`. 1 ligne de titre + 1 ligne « niveau · distance · ancienneté ». Toucher → onglet Alertes. |
| Filtres | Puces défilantes : « Signalements » (bleue quand active) puis les 4 niveaux de risque (coche dans le point de couleur quand le niveau est affiché, puce grise quand il est masqué). Toucher = afficher / masquer, retour haptique. |
| Zones | Remplissage couleur du niveau à 20 %, contour 2 px. Toucher → panneau « zone ». |
| Signalements | Pastille ronde 32 px de la couleur du niveau, icône blanche, bordure blanche 2,5 px. Toucher → panneau « signalement ». |
| Boutons flottants | À gauche : recentrer (48 px). À droite : **SOS** rond 68 px, rouge `sos`, icône `Siren` + « SOS », bordure blanche 4 px, ombre forte. |
| Panneau bas | Coins supérieurs `xl`, poignée 40×4. Contenu selon l'état (ci-dessous). |

**États du panneau**

| État | Contenu |
|---|---|
| Par défaut | Icône `Route` + aide « Touchez une zone… Appui long : itinéraire sûr » |
| Zone touchée | Nom, commune, « zone de démonstration » si besoin, pastille de risque, indice /100, bouton fermer |
| Signalement touché | Pastille de niveau, description (2 lignes max), commune · ancienneté · confirmations, bouton « Voir le détail » |
| Destination choisie (appui long) | « Itinéraire sûr », texte d'aide, boutons Calculer (primaire) / Effacer (contour) |
| Itinéraire calculé | Distance · durée · « aucune rue inondée signalée » ; si aucun trajet n'est sûr, texte en `modere` + itinéraire tracé en orange |
| Erreur réseau | Bandeau rouge sous l'en-tête « … — toucher pour réessayer » |

## Écran Alertes

- Sous-titre dynamique : « 2 en cours · 1 danger » / « Aucune alerte en cours ».
- Carte d'alerte : liseré du niveau, `PastilleNiveau`, heure (`Clock`), titre `titre3`, message `corps`, lieu (`MapPin`) · distance, bouton secondaire « Écouter l'alerte » → devient primaire « Arrêter la lecture » pendant la lecture.
- Filtres : segments Toutes / Danger (avec le nombre) / Vigilance / Info.
- Chargement initial : 2 squelettes (180 et 150 px). Vide : `EtatVide` « Tout est calme ». Filtre sans résultat : « Aucune alerte de ce niveau ».
- Rechargement automatique toutes les 60 s ; une **nouvelle** alerte DANGER est lue à voix haute automatiquement.

## Écran Signaler

Formulaire en 4 étapes numérotées ; le numéro devient une coche verte quand l'étape est remplie.

| Étape | Contrôle | Validation |
|---|---|---|
| 1. Où êtes-vous ? | Carte position (icône, état, coordonnées) + bouton actualiser | Position obligatoire |
| 2. Quel niveau d'eau ? | 3 choix radio (72 px min) : icône dans un carré, libellé coloré, aide, rond radio. Sélection : bordure 2 px + fond doux de la couleur du niveau | Obligatoire |
| 3. Que voyez-vous ? | `Champ` multiligne, compteur « n/1000 » + conseil de repère | 5 caractères minimum |
| 4. Photo | Boutons « Prendre » / « Galerie » (contour) ; aperçu 200 px avec bouton retirer | Facultatif |

Bouton « Envoyer le signalement » désactivé tant que 1–3 ne sont pas remplies. Succès : carte verte en haut avec icône qui rebondit, vibration de succès, formulaire réinitialisé. Lien fantôme « Des personnes en danger ? SOS » en bas.

## Écran SOS (modale)

- Avant envoi : texte d'avertissement centré, bouton rond 168 px rouge (icône `Siren` 40, « SOS » `affiche`, « MAINTENIR APPUYÉ »). **Il faut maintenir 1,5 s** : un disque rouge foncé grandit sous le contenu ; relâcher avant annule. Vibration forte au déclenchement. Avec un lecteur d'écran, le double toucher envoie directement. Halo pulsant (désactivé si « réduire les animations »), carte « Aidez les secours (facultatif) » avec 3 champs.
- Après envoi : carte rouge de suivi (icône sablier puis ambulance, « Demande envoyée » / « Les secours arrivent »), consigne de sécurité sur fond blanc, bouton « Annuler ma demande » tant que personne ne l'a prise.
- Numéros d'urgence : 3 tuiles 96 px (180, 185, 110) qui lancent l'appel.

## Écrans Profil, Conseils, Assistant, Autorités, Secours

| Écran | Points clés |
|---|---|
| Profil | Carte bleue d'identité : avatar à initiales, rôle · commune, 3 statistiques (points, rang « 1er / 2e », signalements). Carte « Prochain objectif » : badge visé, barre de progression animée (ex. 1/5 signalements confirmés, ou écart de points avec le 1er du mois). Liens vers les espaces pro si le rôle le permet. Badges en grille de 2 (icône dans un cercle coloré). Classement : médailles or/argent/bronze, ligne « (vous) » surlignée. |
| Conseils | Segments Avant / Pendant / Après + phrase d'introduction avec icône. Conseils numérotés, icône haut-parleur (toucher = écouter). Bloc bleu « Conseils pour ma situation » avec champ blanc. Lien vers l'assistant. |
| Assistant | Bulles : utilisateur à droite (bleu), IA à gauche (blanc, avatar `Sparkles`), lien « Écouter » sous chaque réponse. 3 suggestions au démarrage. Barre de saisie fixe en bas, bouton d'envoi rond 48 px gris tant que vide. |
| Autorités | 2 tuiles de compteurs, alertes à valider (mention « proposée automatiquement »), boutons Publier / Écarter, puis signalements à vérifier (confirmations, ⚠ secours). |
| Secours | Bandeau rouge « n demande(s) sans équipe » ou bleu si tout est pris en charge. Cartes : statut, ancienneté, nombre de personnes — nom, situation, Itinéraire / Appeler, puis « Prendre en charge » (rouge) ou « Intervention terminée » (bleu). Rafraîchissement toutes les 30 s. |

## Cas limites

| Cas | Comportement |
|---|---|
| Pas de réseau | Bandeau d'erreur avec le message de l'API (« Serveur injoignable… »), données précédentes conservées |
| Localisation refusée | Signaler : « Position indisponible — autorisez la localisation » ; SOS : message d'erreur qui renvoie vers le 180 |
| Texte long | Titres d'alerte sur 1 ligne dans le bandeau de carte (`numberOfLines`), descriptions sur 2 lignes dans les listes, texte complet dans le détail |
| Pas de photo | Rien n'est réservé (pas d'espace vide) |
| IA indisponible | Réponses de repli affichées normalement (aucun message technique) |
| Premier lancement | Polices en chargement : logo vertical + indicateur ; puis écran de bienvenue (une seule fois) |

## Mouvement

| Élément | Déclencheur | Animation | Durée |
|---|---|---|---|
| Boutons | Appui | Couleur appuyée + échelle 0,98 (sans décaler la mise en page) | immédiat |
| Squelettes | Chargement | Opacité 0,55 ↔ 1 | 700 ms aller |
| Halo SOS | Écran SOS | Échelle 1 ↔ 1,12 | 900 ms aller |
| Carte | Recentrer | `animateToRegion` | 400 ms |

Toutes les animations en boucle sont **désactivées** quand l'option système « Réduire les animations » est active.

## Accessibilité

- Ordre de lecture = ordre visuel (haut → bas, gauche → droite).
- Tous les boutons icône ont un `accessibilityLabel` (« Actualiser la carte », « Centrer sur ma position », « SOS : demander du secours », « Envoyer »…).
- Les choix de niveau sont des `radio` avec l'état `checked` et un libellé complet (« Élevé : Danger : maisons envahies… »).
- Les messages (succès, erreur, suivi SOS) sont des régions « live » annoncées automatiquement.
- Les alertes peuvent toutes être **écoutées** : utile pour les personnes qui lisent difficilement.
- Les mots de passe acceptent le gestionnaire de mots de passe et le collage (`autoComplete`).
