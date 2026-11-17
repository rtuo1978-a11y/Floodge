"""Consignes données au modèle pour chaque tâche.

Le comportement général (rôle, ton, règles de sécurité) est dans le Modelfile (SYSTEM).
Ici, on précise la tâche demandée à chaque appel.
"""

ANALYSE = """Tâche : analyser un signalement d'inondation envoyé par un habitant.
Réponds uniquement en JSON avec :
- graviteEstimee : FAIBLE (eau peu profonde), MODERE (circulation perturbée) ou ELEVE (danger pour les personnes, maisons envahies, personnes bloquées)
- credibilite : nombre entre 0 et 1 (description précise et cohérente = élevé ; vague, hors sujet, blague = faible)
- resume : une phrase courte (moins de 20 mots) pour les secours
- motsCles : 1 à 5 mots-clés (lieu, obstacle, personnes…)
- besoinSecours : true si des personnes sont bloquées, blessées, emportées ou en danger immédiat

Niveau choisi par l'habitant : {niveau}
Commune : {commune}
Description : « {description} »"""

TEXTE_VOCAL = """Tâche : écrire le texte d'une alerte qui sera LUE À VOIX HAUTE par le téléphone.
Règles : 2 ou 3 phrases courtes, français simple, sans abréviation, sans emoji, moins de 50 mots.
Commencer par « Alerte FlowManage. ». Dire le lieu, le danger, puis UNE action à faire.
Ne rien inventer qui ne soit pas dans l'alerte.

Niveau : {niveau}
Commune : {commune}
Titre : {titre}
Message : {message}"""

CONSEILS = """Tâche : donner des conseils de sécurité adaptés à la situation décrite par un habitant.
Réponds uniquement en JSON : {{"conseils": ["...", "..."]}} avec 3 à 5 conseils concrets,
une phrase chacun, du plus urgent au moins urgent. Si une vie est en danger, le premier conseil
est d'appeler les sapeurs-pompiers au 180 ou d'utiliser le bouton SOS de FlowManage.

Commune : {commune}
Niveau de risque de la zone : {niveau_risque}
Situation : « {situation} »"""


def ou_inconnu(valeur: str | None) -> str:
    return valeur if valeur else "non précisée"
