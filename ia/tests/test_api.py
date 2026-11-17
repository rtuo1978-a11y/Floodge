import json

import pytest
from fastapi.testclient import TestClient

from app import main, ollama, repli
from app.config import settings

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def sans_cle(monkeypatch):
    monkeypatch.setattr(settings, "internal_api_key", "")


@pytest.fixture
def ollama_eteint(monkeypatch):
    async def echec(*args, **kwargs):
        raise ollama.OllamaIndisponible("connexion refusée")

    monkeypatch.setattr(ollama, "discuter", echec)


@pytest.fixture
def ollama_repond(monkeypatch):
    """Simule Ollama : renvoie la réponse préparée dans `reponses`."""
    reponses: list[str] = []

    async def faux(*args, **kwargs):
        return reponses.pop(0)

    monkeypatch.setattr(ollama, "discuter", faux)
    return reponses


# ---------- Sans Ollama : règles de repli ----------


def test_analyse_repli_detecte_besoin_de_secours(ollama_eteint):
    r = client.post(
        "/analyse-signalement",
        json={"description": "Une famille est bloquée sur le toit, l'eau arrive à la poitrine", "niveau": "MODERE"},
    )
    assert r.status_code == 200
    d = r.json()
    assert d["source"] == "regles"
    assert d["besoinSecours"] is True
    assert d["graviteEstimee"] == "ELEVE"


def test_analyse_repli_description_vague_peu_credible(ollama_eteint):
    vague = client.post("/analyse-signalement", json={"description": "eau", "niveau": "ELEVE"}).json()
    precise = client.post(
        "/analyse-signalement",
        json={"description": "Au carrefour de la pharmacie, la route est coupée, 40 cm d'eau, les voitures ne passent plus", "niveau": "MODERE"},
    ).json()
    assert vague["credibilite"] < precise["credibilite"]
    assert precise["graviteEstimee"] == "MODERE"


def test_texte_vocal_repli(ollama_eteint):
    r = client.post(
        "/texte-vocal",
        json={"titre": "Inondation à Riviera Palmeraie", "message": "Les routes sont coupées. Évitez le secteur.", "niveau": "DANGER", "commune": "Cocody"},
    ).json()
    assert r["texte"].startswith("Alerte Floodge à Cocody.")
    assert "hauteur" in r["texte"]


def test_conseils_repli_urgence(ollama_eteint):
    r = client.post("/conseils", json={"situation": "L'eau monte dans ma maison"}).json()
    assert r["source"] == "regles"
    assert "180" in r["conseils"][0]


def test_chat_repli(ollama_eteint):
    r = client.post("/chat", json={"messages": [{"role": "user", "content": "Bonjour"}]}).json()
    assert r["source"] == "regles"
    assert "180" in r["reponse"]


# ---------- Avec Ollama (simulé) ----------


def test_analyse_par_ollama(ollama_repond):
    ollama_repond.append(
        json.dumps({"graviteEstimee": "MODERE", "credibilite": 0.8, "resume": "Route coupée", "motsCles": ["route"], "besoinSecours": False})
    )
    d = client.post("/analyse-signalement", json={"description": "La route est coupée par l'eau", "niveau": "MODERE"}).json()
    assert d["source"] == "ollama"
    assert d["resume"] == "Route coupée"


def test_les_regles_corrigent_un_oubli_de_secours(ollama_repond):
    ollama_repond.append(
        json.dumps({"graviteEstimee": "MODERE", "credibilite": 0.9, "resume": "Eau", "motsCles": [], "besoinSecours": False})
    )
    d = client.post("/analyse-signalement", json={"description": "Un enfant est coincé dans la maison", "niveau": "ELEVE"}).json()
    assert d["besoinSecours"] is True


def test_reponse_ollama_invalide_bascule_sur_les_regles(ollama_repond):
    ollama_repond.append("ceci n'est pas du JSON")
    d = client.post("/analyse-signalement", json={"description": "Rue inondée", "niveau": "FAIBLE"}).json()
    assert d["source"] == "regles"


def test_conseils_par_ollama(ollama_repond):
    ollama_repond.append(json.dumps({"conseils": ["Montez à l'étage.", "Appelez le 180."]}))
    d = client.post("/conseils", json={"situation": "eau dans la cour"}).json()
    assert d == {"conseils": ["Montez à l'étage.", "Appelez le 180."], "source": "ollama"}


# ---------- Sécurité ----------


def test_cle_interne_obligatoire(monkeypatch, ollama_eteint):
    monkeypatch.setattr(settings, "internal_api_key", "secret")
    assert client.post("/conseils", json={"situation": "pluie"}).status_code == 401
    ok = client.post("/conseils", json={"situation": "pluie"}, headers={"x-api-key": "secret"})
    assert ok.status_code == 200


def test_validation_des_entrees():
    assert client.post("/analyse-signalement", json={"description": "", "niveau": "ENORME"}).status_code == 422


def test_repli_sans_accents():
    a = repli.analyser("Personne âgée bloquée à l'étage, l'eau est entrée dans la maison", "MODERE")
    assert a.besoinSecours is True


def test_vehicules_bloques_ne_declenchent_pas_les_secours():
    a = repli.analyser("La voie est sous l'eau, les voitures sont bloquées au carrefour", "MODERE")
    assert a.besoinSecours is False
    b = repli.analyser("Les voitures sont bloquées et une famille est coincée dedans", "ELEVE")
    assert b.besoinSecours is True
