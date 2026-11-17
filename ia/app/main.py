"""Service IA de Floodge — appelé uniquement par le back-end.

Lancer : uvicorn app.main:app --reload --port 8000
Documentation : http://localhost:8000/docs
"""

import logging

from fastapi import Depends, FastAPI, Header, HTTPException

from . import ollama, prompts, repli
from .config import settings
from .schemas import (
    AnalyseSignalement,
    Conseils,
    DemandeAnalyse,
    DemandeChat,
    DemandeConseils,
    DemandeTexteVocal,
    ReponseChat,
    TexteVocal,
)

log = logging.getLogger("floodge.ia")

app = FastAPI(
    title="Floodge IA",
    description="Analyse des signalements, conseils et textes d'alerte vocale (Ollama).",
    version="0.1.0",
)


def verifier_cle(x_api_key: str | None = Header(default=None)) -> None:
    if settings.internal_api_key and x_api_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Clé interne invalide")


@app.get("/sante")
async def sante():
    return {"statut": "ok", "modele": settings.ollama_modele, "ollamaDisponible": await ollama.est_disponible()}


@app.post("/analyse-signalement", response_model=AnalyseSignalement, dependencies=[Depends(verifier_cle)])
async def analyse_signalement(d: DemandeAnalyse) -> AnalyseSignalement:
    consigne = prompts.ANALYSE.format(
        niveau=d.niveau, commune=prompts.ou_inconnu(d.commune), description=d.description
    )
    schema = AnalyseSignalement.model_json_schema()
    schema["properties"].pop("source", None)
    try:
        brut = await ollama.discuter_json([{"role": "user", "content": consigne}], schema, temperature=0.1)
        analyse = AnalyseSignalement.model_validate({**brut, "source": "ollama"})
        # Sécurité : si les règles détectent un besoin de secours, on ne laisse pas l'IA l'ignorer
        if repli.analyser(d.description, d.niveau).besoinSecours:
            analyse.besoinSecours = True
        return analyse
    except Exception as e:  # Ollama absent, JSON invalide, valeurs hors limites…
        log.warning("Analyse par règles (Ollama indisponible : %s)", e)
        return repli.analyser(d.description, d.niveau)


@app.post("/texte-vocal", response_model=TexteVocal, dependencies=[Depends(verifier_cle)])
async def texte_vocal(d: DemandeTexteVocal) -> TexteVocal:
    consigne = prompts.TEXTE_VOCAL.format(
        niveau=d.niveau, commune=prompts.ou_inconnu(d.commune), titre=d.titre, message=d.message
    )
    try:
        texte = (await ollama.discuter([{"role": "user", "content": consigne}], temperature=0.2)).strip()
        if not texte or len(texte) > 400:
            raise ValueError("texte vide ou trop long")
        return TexteVocal(texte=texte)
    except Exception as e:
        log.warning("Texte vocal par modèle (Ollama indisponible : %s)", e)
        return TexteVocal(texte=repli.texte_vocal(d.titre, d.message, d.niveau, d.commune), source="regles")


@app.post("/conseils", response_model=Conseils, dependencies=[Depends(verifier_cle)])
async def conseils(d: DemandeConseils) -> Conseils:
    consigne = prompts.CONSEILS.format(
        commune=prompts.ou_inconnu(d.commune),
        niveau_risque=prompts.ou_inconnu(d.niveauRisque),
        situation=d.situation,
    )
    schema = {
        "type": "object",
        "properties": {"conseils": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 6}},
        "required": ["conseils"],
    }
    try:
        brut = await ollama.discuter_json([{"role": "user", "content": consigne}], schema)
        liste = [c.strip() for c in brut.get("conseils", []) if isinstance(c, str) and c.strip()]
        if not liste:
            raise ValueError("aucun conseil")
        return Conseils(conseils=liste[:6])
    except Exception as e:
        log.warning("Conseils de référence (Ollama indisponible : %s)", e)
        return Conseils(conseils=repli.conseils(d.situation), source="regles")


@app.post("/chat", response_model=ReponseChat, dependencies=[Depends(verifier_cle)])
async def chat(d: DemandeChat) -> ReponseChat:
    try:
        reponse = await ollama.discuter([m.model_dump() for m in d.messages], temperature=0.5)
        return ReponseChat(reponse=reponse.strip())
    except Exception as e:
        log.warning("Chat indisponible : %s", e)
        return ReponseChat(reponse=repli.REPONSE_CHAT, source="regles")
