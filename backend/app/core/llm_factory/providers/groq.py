import logging
from typing import Any

import httpx
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq

from app.core.llm_factory.base import LLMProviderStrategy

logger = logging.getLogger(__name__)


class GroqProviderStrategy(LLMProviderStrategy):
    """Estratégia para o provedor Groq Cloud."""

    def create_model(
        self,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: int = 30,
        **kwargs: Any,
    ) -> BaseChatModel:
        """
        Instancia uma conexão ChatGroq.

        Args:
            model: Identificador do modelo na Groq (ex: 'llama-3.3-70b-versatile').
            api_key: Chave secreta de autenticação Groq.
            base_url: Endpoint base personalizado (opcional).
            temperature: Temperatura de amostragem.
            timeout_seconds: Limite de tempo em segundos.
            **kwargs: Argumentos extras para o construtor ChatGroq.

        Returns:
            Instância configurada de ChatGroq.

        Raises:
            ValueError: Se model ou api_key não forem fornecidos.
        """
        if not model:
            raise ValueError("O parâmetro 'model' é obrigatório para o provedor Groq.")
        if not api_key:
            raise ValueError("A chave de API ('api_key') é obrigatória para o provedor Groq.")

        return ChatGroq(
            model=model,
            api_key=api_key,
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
        """
        Consulta os modelos ativos disponíveis na API da Groq.

        Args:
            api_key: Chave de API para autenticação.
            base_url: Endpoint customizado (opcional).
            timeout_seconds: Timeout da requisição.

        Returns:
            Lista de nomes de modelos disponíveis ordenados por prioridade.

        Raises:
            ValueError: Se a chave for inválida ou se a requisição HTTP falhar.
        """
        if not api_key:
            return []
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
            if resp.status_code in (401, 403):
                raise ValueError("Chave de API do Groq inválida ou não autorizada.")
            if resp.status_code == 200:
                data = resp.json()
                raw_items = data.get("data", [])
                chat_models: list[str] = []
                for item in raw_items:
                    model_id = item.get("id", "")
                    if not item.get("active", True):
                        continue
                    # Filtrar modelos de transcrição/áudio e guardrails
                    lowered = model_id.lower()
                    if any(kw in lowered for kw in ("whisper", "guard", "orpheus", "tts", "audio")):
                        continue
                    output_modalities = item.get("output_modalities") or ["text"]
                    if "text" not in output_modalities:
                        continue
                    chat_models.append(model_id)

                priority_order = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "allam-2-7b"]
                sorted_models = [m for m in priority_order if m in chat_models]
                for m in chat_models:
                    if m not in sorted_models:
                        sorted_models.append(m)

                return sorted_models or [m.get("id") for m in raw_items if "id" in m]

            raise ValueError(f"Falha ao consultar modelos Groq: HTTP {resp.status_code}")
