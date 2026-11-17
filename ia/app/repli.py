"""Réponses de secours quand Ollama n'est pas disponible.

Règles simples sur des mots-clés : l'application reste utilisable sans IA
(par exemple pendant la démonstration si l'ordinateur qui fait tourner Ollama est éteint).
"""

import re
import unicodedata

from .schemas import AnalyseSignalement, Niveau


def _normaliser(texte: str) -> str:
    sans_accents = unicodedata.normalize("NFD", texte.lower())
    return "".join(c for c in sans_accents if unicodedata.category(c) != "Mn")


MOTS_SECOURS = [
    "bloque", "coince", "piege", "emporte", "noye", "blesse", "secours", "aidez", "au secours",
    "sur le toit", "enfant", "bebe", "personne agee", "malade", "disparu", "eboulement", "effondre",
]
MOTS_ELEVE = [
    "poitrine", "taille", "cou", "maison inondee", "maisons inondees", "dans la maison", "envahi",
    "courant fort", "emporte", "effondre", "eboulement", "glissement", "mur tombe", "1 metre", "un metre",
]
MOTS_MODERE = [
    "genou", "voiture", "vehicule", "route", "rue", "circulation", "caniveau", "deborde", "gbaka", "woro",
]
def _contient(texte: str, mots: list[str]) -> list[str]:
    """Mots présents en entier (accords tolérés : bloque → bloquée, bloqués ; genou → genoux)."""
    return [m for m in mots if re.search(rf"\b{re.escape(m)}(e|s|es|x)?\b", texte)]


MOTS_LIEU = ["carrefour", "pont", "rue", "route", "marche", "ecole", "eglise", "mosquee", "pharmacie", "gare", "quartier"]


def analyser(description: str, niveau: Niveau) -> AnalyseSignalement:
    texte = _normaliser(description)

    secours = _contient(texte, MOTS_SECOURS)
    eleve = _contient(texte, MOTS_ELEVE)
    modere = _contient(texte, MOTS_MODERE)
    lieux = _contient(texte, MOTS_LIEU)

    if eleve or secours:
        gravite: Niveau = "ELEVE"
    elif modere:
        gravite = "MODERE"
    else:
        gravite = niveau

    # Crédibilité : description précise (longueur, lieu, chiffres) et cohérente avec le niveau choisi
    mots = len(texte.split())
    credibilite = 0.35
    credibilite += min(mots, 25) / 25 * 0.3
    credibilite += 0.15 if lieux else 0
    credibilite += 0.1 if re.search(r"\d", texte) else 0
    credibilite += 0.1 if gravite == niveau else 0
    credibilite = round(min(credibilite, 1.0), 2)

    phrase = description.strip().split(".")[0]
    resume = phrase if len(phrase) <= 120 else phrase[:117] + "..."

    return AnalyseSignalement(
        graviteEstimee=gravite,
        credibilite=credibilite,
        resume=resume,
        motsCles=list(dict.fromkeys(secours + eleve + modere + lieux))[:5],
        besoinSecours=bool(secours),
        source="regles",
    )


def texte_vocal(titre: str, message: str, niveau: str, commune: str | None) -> str:
    action = {
        "DANGER": "Mettez-vous immédiatement en hauteur et évitez de vous déplacer.",
        "VIGILANCE": "Évitez les bas-fonds et ne traversez pas les rues inondées.",
        "INFO": "Restez informés sur l'application Floodge.",
    }.get(niveau, "Restez prudents.")
    lieu = f" à {commune}" if commune else ""
    premiere_phrase = message.strip().split(".")[0]
    return f"Alerte Floodge{lieu}. {titre}. {premiere_phrase}. {action}"


CONSEILS_URGENCE = [
    "Si une vie est en danger, appelez les sapeurs-pompiers au 180 ou utilisez le bouton SOS de Floodge.",
    "Montez à l'étage ou rejoignez un endroit en hauteur, loin des bas-fonds.",
    "Coupez l'électricité si vous pouvez le faire sans toucher l'eau.",
    "Ne traversez pas une rue inondée, ni à pied ni en voiture : 30 cm d'eau suffisent à emporter un véhicule.",
]
CONSEILS_PREVENTION = [
    "Préparez un sac avec de l'eau, une lampe, des médicaments et vos papiers dans une pochette étanche.",
    "Ne jetez pas d'ordures dans les caniveaux : bouchés, ils font monter l'eau dans le quartier.",
    "Suivez les bulletins de la SODEXAM et les alertes Floodge pendant la saison des pluies.",
    "Repérez à l'avance un lieu en hauteur où vous réfugier avec votre famille.",
]


def conseils(situation: str) -> list[str]:
    texte = _normaliser(situation)
    urgence = bool(_contient(texte, MOTS_SECOURS + MOTS_ELEVE)) or bool(
        re.search(r"\b(eau|inond\w*|monte\w*|crue)\b", texte)
    )
    return CONSEILS_URGENCE if urgence else CONSEILS_PREVENTION


REPONSE_CHAT = (
    "Je suis momentanément indisponible. En cas de danger : mettez-vous en hauteur, "
    "appelez les sapeurs-pompiers au 180 ou utilisez le bouton SOS de l'application."
)
