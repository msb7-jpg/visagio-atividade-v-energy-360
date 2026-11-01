"""Configurações globais da aplicação V-Energy Grid 360."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações carregadas de variáveis de ambiente ou arquivo .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = "V-Energy Grid 360 API"
    project_version: str = "2026.2"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite+aiosqlite:///./v_energy.db"
    backend_cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    log_level: str = "INFO"

    # Gestão de perdas: fixa a competência ('YYYY-MM') em que a fila de suspeitas é calculada, para demonstrar a fila
    # como ela estava num mês passado. Ausente = competência mais recente dos dados (comportamento de produção).
    loss_reference_competencia: str | None = Field(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$")

    jwt_secret_key: str = "v-energy-grid-360-jwt-secret-key-2026-visagio-super-secure"  # ruff: ignore[hardcoded-password-string]
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 horas

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    ai_model_name: str | None = Field(default=None, alias="AI_MODEL_NAME")
    ai_provider: str | None = Field(default=None, alias="AI_PROVIDER")
    ai_base_url: str | None = Field(default=None, alias="AI_BASE_URL")

    default_users: dict[str, dict[str, str]] = {
        "diretor@venergy.com": {
            "nome": "Henrique Duarte (Diretor Comercial)",
            "senha_hash": (
                "$argon2id$v=19$m=65536,t=3,p=4$991YbQOF+cA9Q7K5kpBkTQ$NF+gckCtiivUGEx9Vm/5TC95qs6+9Hgv28lO058/Hok"
            ),
            "role": "diretor",
        },
        "operacao@venergy.com": {
            "nome": "Beatriz Farias (Gerente de Operação)",
            "senha_hash": (
                "$argon2id$v=19$m=65536,t=3,p=4$JkA9nCavgPH7MyJVO5uTcw$M1jJqVq7Jb+lHDElvz/GWOgwD8lg+ubRdJV+mveto3c"
            ),
            "role": "gerente_operacao",
        },
        "atendimento@venergy.com": {
            "nome": "Camila Barreto (Atendimento)",
            "senha_hash": (
                "$argon2id$v=19$m=65536,t=3,p=4$ZJV1u3FqLplUdVqprLyTbQ$naKUNRkqeoY7sfwNaS//YkAz6nNwcezCkASJOfkq4IA"
            ),
            "role": "atendente",
        },
        "gerente.atendimento@venergy.com": {
            "nome": "Camila Barreto (Gerente de Atendimento)",
            "senha_hash": (
                "$argon2id$v=19$m=65536,t=3,p=4$gWxNxh+iXi4Jj1U56Zt6rg$W+/M6YvJ0Q87G9wPRjb7Jh5VCh5RNXRuRWGQs5s9ois"
            ),
            "role": "gerente_atendimento",
        },
        "perdas@venergy.com": {
            "nome": "Rafael Coutinho (Gerente de Perdas)",
            "senha_hash": (
                "$argon2id$v=19$m=65536,t=3,p=4$LYaDhHVNO+yCod4S0Au9Rg$t0skciUoZE4xg069YmtVUiqfN2RovKKwl8X7iJdcFhU"
            ),
            "role": "gerente_perdas",
        },
    }

    @field_validator("loss_reference_competencia", mode="before")
    @classmethod
    def blank_reference_means_none(cls, value: object) -> object:
        """Trata `LOSS_REFERENCE_COMPETENCIA=""` como ausente, para uma variável opcional vazia não derrubar a app."""
        if isinstance(value, str) and not value.strip():
            return None
        return value


@lru_cache
def get_settings() -> Settings:
    """Devolve as configurações da aplicação, lidas do ambiente uma única vez (cache).

    Returns:
        Instância compartilhada de `Settings`.
    """
    return Settings()
