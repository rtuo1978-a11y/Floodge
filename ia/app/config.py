from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ollama_url: str = "http://localhost:11434"
    # Modèle créé avec : ollama create flowmanage -f Modelfile
    ollama_modele: str = "flowmanage"
    ollama_timeout_s: float = 60.0
    # Clé partagée avec le back-end (en-tête x-api-key). Vide = pas de contrôle (développement).
    internal_api_key: str = ""


settings = Settings()
