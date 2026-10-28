from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import get_settings
from app.core.constants import LLMProvider
from app.core.llm_factory.providers import (
    GoogleGenAIProviderStrategy,
    GroqProviderStrategy,
    GroundedMockStrategy,
    LocalOpenAIProviderStrategy,
    OpenRouterProviderStrategy,
)
from app.core.llm_factory.registry import LLMProviderRegistry

# Instância global do registry pré-populada com todos os provedores suportados
provider_registry = LLMProviderRegistry()
provider_registry.register(LLMProvider.GOOGLE.value, GoogleGenAIProviderStrategy())
provider_registry.register(LLMProvider.GROQ.value, GroqProviderStrategy())
provider_registry.register(LLMProvider.LOCAL.value, LocalOpenAIProviderStrategy())
provider_registry.register(LLMProvider.OPENROUTER.value, OpenRouterProviderStrategy())
provider_registry.register(LLMProvider.MOCK.value, GroundedMockStrategy())


PROVIDER_DEFAULT_MODELS: dict[str, str] = {
    LLMProvider.OPENROUTER.value: "google/gemini-2.5-flash-lite",
    LLMProvider.LOCAL.value: "local-model",
    LLMProvider.GOOGLE.value: "gemini-2.5-flash-lite",
    LLMProvider.MOCK.value: "mock",
}


def get_chat_model(
    provider: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    temperature: float = 0.0,
    timeout_seconds: int = 30,
    **kwargs: Any,
) -> BaseChatModel:
    """
    Fábrica extensível para instanciar instâncias de BaseChatModel consultando o Provider Registry.

    Se provider não for informado:
    - Se settings.ai_provider estiver configurado, utiliza o provedor configurado.
    - Se GEMINI_API_KEY estiver configurado, usa 'google'.
    - Caso contrário, usa fallback para 'mock'.
    """
    settings = get_settings()

    resolved_provider = provider or settings.ai_provider
    if not resolved_provider:
        resolved_provider = LLMProvider.GOOGLE.value if settings.gemini_api_key else LLMProvider.MOCK.value

    resolved_base_url = base_url or settings.ai_base_url

    # Fallback consciente do provedor para garantir compatibilidade
    resolved_model = (
        model or settings.ai_model_name or PROVIDER_DEFAULT_MODELS.get(resolved_provider)
    )

    strategy = provider_registry.get(resolved_provider)
    return strategy.create_model(
        model=resolved_model,
        api_key=api_key,
        base_url=resolved_base_url,
        temperature=temperature,
        timeout_seconds=timeout_seconds,
        **kwargs,
    )
