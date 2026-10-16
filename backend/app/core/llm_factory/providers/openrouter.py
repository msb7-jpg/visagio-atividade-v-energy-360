import logging
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.core.llm_factory.base import LLMProviderStrategy

logger = logging.getLogger(__name__)


class OpenRouterProviderStrategy(LLMProviderStrategy):
    """Estratégia para o gateway multi-modelo OpenRouter via langchain-openai."""

    DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"

    def create_model(
        self,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: int = 30,
        **kwargs: Any,
    ) -> BaseChatModel:
        if not model:
            model = "google/gemini-2.5-flash-lite"
        if not api_key:
            raise ValueError("A chave de API ('api_key') é obrigatória para o provedor OpenRouter.")

        resolved_url = base_url or self.DEFAULT_BASE_URL

        return ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=resolved_url,
            temperature=temperature,
            timeout=float(timeout_seconds),
            **kwargs,
        )

    async def list_models(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 5.0,
    ) -> list[str]:
        del api_key, base_url, timeout_seconds
        return [
            "google/gemini-2.5-flash-lite",
            "meta-llama/llama-3.3-70b-instruct",
            "anthropic/claude-3.5-sonnet",
        ]
