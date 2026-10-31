"""Regra única para saber se há um provedor de IA configurado, sem cair em silêncio no modo simulado."""

from app.core.config import get_settings
from app.core.constants import SUPPORTED_PROVIDERS, LLMProvider

AI_UNAVAILABLE_MESSAGE = (
    "Assistente de IA indisponível: nenhum provedor de IA está configurado. "
    "Configure GEMINI_API_KEY ou AI_PROVIDER no backend/.env (veja a seção de IA do README) e reinicie a API."
)


class AIProviderNotConfiguredError(RuntimeError):
    """Nenhum provedor de IA foi configurado, e o sistema não deve inventar uma resposta."""

    def __init__(self) -> None:
        super().__init__(AI_UNAVAILABLE_MESSAGE)


def resolve_configured_provider(requested_provider: str | None = None) -> str | None:
    """Devolve o provedor de IA que será usado, ou None quando nada foi configurado.

    O modo simulado (`mock`) só vale quando escolhido de propósito, no pedido ou em `AI_PROVIDER`.
    Sem provedor e sem `GEMINI_API_KEY`, ou com um provedor desconhecido, não há IA: quem chama deve avisar o
    usuário em vez de responder.

    Args:
        requested_provider: Provedor pedido na chamada; tem prioridade sobre o `.env`.

    Returns:
        Nome do provedor, ou None quando nenhum provedor está configurado.
    """
    settings = get_settings()
    provider = requested_provider or settings.ai_provider
    if provider and provider != LLMProvider.GOOGLE.value:
        return provider if provider in SUPPORTED_PROVIDERS else None
    return LLMProvider.GOOGLE.value if settings.gemini_api_key else None
