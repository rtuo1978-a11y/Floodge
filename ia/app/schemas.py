from typing import Literal

from pydantic import BaseModel, Field

Niveau = Literal["FAIBLE", "MODERE", "ELEVE"]
Source = Literal["ollama", "regles"]


class DemandeAnalyse(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    niveau: Niveau
    commune: str | None = None


class AnalyseSignalement(BaseModel):
    graviteEstimee: Niveau
    credibilite: float = Field(ge=0, le=1, description="0 = douteux, 1 = très crédible")
    resume: str = Field(max_length=200)
    motsCles: list[str] = Field(default_factory=list, max_length=8)
    besoinSecours: bool
    source: Source = "ollama"


class DemandeTexteVocal(BaseModel):
    titre: str = Field(max_length=200)
    message: str = Field(max_length=2000)
    niveau: Literal["INFO", "VIGILANCE", "DANGER"]
    commune: str | None = None


class TexteVocal(BaseModel):
    texte: str
    source: Source = "ollama"


class DemandeConseils(BaseModel):
    situation: str = Field(min_length=1, max_length=1000)
    commune: str | None = None
    niveauRisque: str | None = None


class Conseils(BaseModel):
    conseils: list[str]
    source: Source = "ollama"


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class DemandeChat(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=20)


class ReponseChat(BaseModel):
    reponse: str
    source: Source = "ollama"
