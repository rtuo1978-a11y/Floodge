"""Client minimal pour l'API REST d'Ollama (https://github.com/ollama/ollama/blob/main/docs/api.md)."""

import json
from typing import Any

import httpx

from .config import settings


class OllamaIndisponible(Exception):
    pass


async def discuter(
    messages: list[dict[str, str]],
    *,
    format_json: dict[str, Any] | None = None,
    temperature: float = 0.3,
) -> str:
    """Envoie une conversation au modèle et renvoie le texte de sa réponse.

    `format_json` : schéma JSON imposé à la réponse (sorties structurées d'Ollama).
    """
    corps: dict[str, Any] = {
        "model": settings.ollama_modele,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if format_json is not None:
        corps["format"] = format_json
    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_s) as client:
            res = await client.post(f"{settings.ollama_url}/api/chat", json=corps)
            res.raise_for_status()
            return res.json()["message"]["content"]
    except (httpx.HTTPError, KeyError, ValueError) as e:
        raise OllamaIndisponible(str(e)) from e


async def discuter_json(messages: list[dict[str, str]], schema: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
    texte = await discuter(messages, format_json=schema, **kwargs)
    try:
        return json.loads(texte)
    except json.JSONDecodeError as e:
        raise OllamaIndisponible(f"Réponse non JSON : {texte[:100]}") from e


async def est_disponible() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            res = await client.get(f"{settings.ollama_url}/api/tags")
            modeles = [m["name"].split(":")[0] for m in res.json().get("models", [])]
            return settings.ollama_modele.split(":")[0] in modeles
    except Exception:
        return False
