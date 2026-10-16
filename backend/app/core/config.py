"""Configurações globais da aplicação V-Energy Grid 360."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações carregadas de variáveis de ambiente ou arquivo .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Informações do Projeto
    project_name: str = "V-Energy Grid 360 API"
    project_version: str = "2026.2"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Banco de Dados SQLite Assíncrono
    database_url: str = "sqlite+aiosqlite:///./v_energy.db"
    backend_cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    log_level: str = "INFO"

    # Autenticação e Segurança (JWT)
    jwt_secret_key: str = "v-energy-grid-360-jwt-secret-key-2026-visagio-super-secure"  # ruff: ignore[hardcoded-password-string]
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 horas

    # Provedores de IA (Gemini / OpenRouter)
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    ai_model_name: str = "gemini-2.5-flash-lite"

    # Usuários Padrão para Testes e Demonstração
    default_users: dict[str, dict[str, str]] = {
        "diretor@venergy.com": {
            "nome": "Henrique Duarte (Diretor Comercial)",
            "senha": "venergy123",
            "role": "diretor",
        },
        "operacao@venergy.com": {
            "nome": "Beatriz Farias (Gerente de Operação)",
            "senha": "venergy123",
            "role": "gerente_operacao",
        },
        "atendimento@venergy.com": {
            "nome": "Camila Barreto (Atendimento)",
            "senha": "venergy123",
            "role": "atendente",
        },
        "perdas@venergy.com": {
            "nome": "Rafael Coutinho (Gerente de Perdas)",
            "senha": "venergy123",
            "role": "gerente_perdas",
        },
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
