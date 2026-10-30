import logging
from typing import Any

import httpx
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.core.llm_factory.base import LLMProviderStrategy

logger = logging.getLogger(__name__)


class LocalOpenAIProviderStrategy(LLMProviderStrategy):
    """
    Estratégia para servidor local compatível com OpenAI (LM Studio / Ollama / llama.cpp).
    Sobrescreve fast_probe para checar endpoints /health ou /v1/health sem inferência.
    """

    def create_model(
        self,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: int = 90,
        **kwargs: Any,
    ) -> BaseChatModel:
        """
        Instancia uma conexão ChatOpenAI apontando para o endpoint local.

        Args:
            model: Identificador do modelo local carregado.
            api_key: Chave dummy ou real (padrão: 'not-needed').
            base_url: URL base onde o servidor local está escutando.
            temperature: Temperatura de amostragem.
            timeout_seconds: Limite de tempo em segundos.
            **kwargs: Argumentos extras.

        Returns:
            Instância configurada de ChatOpenAI.

        Raises:
            ValueError: Se base_url não for informada.
        """
        if not base_url:
            raise ValueError("O parâmetro 'base_url' é obrigatório para provedores locais.")

        extra_body = kwargs.pop("extra_body", {})
        if "chat_template_kwargs" not in extra_body:
            extra_body["chat_template_kwargs"] = {"enable_thinking": False}

        return ChatOpenAI(
            model=model or "models/Qwen3.5-4B-Q4_K_M.gguf",
            api_key=api_key or "not-needed",
            base_url=base_url,
            temperature=temperature,
            timeout=float(timeout_seconds),
            extra_body=extra_body,
            **kwargs,
        )

    async def fast_probe(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout_seconds: float = 3.0,
    ) -> tuple[bool, str | None]:
        """
        Verifica conectividade com o servidor local sem executar inferência pesada.

        Args:
            base_url: Endpoint base do servidor local.
            api_key: Chave de API opcional.
            timeout_seconds: Limite de tempo para a verificação.

        Returns:
            Tupla (is_healthy, mensagem).
        """
        if not base_url:
            return False, "Base URL não informada para o provedor local."

        target_base = base_url.rstrip("/")
        if target_base.endswith("/v1"):
            root = target_base[:-3]
            candidates = [f"{root}/health", f"{target_base}/health"]
        else:
            candidates = [f"{target_base}/health", f"{target_base}/v1/health"]

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                for url in candidates:
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            data = resp.json()
                            valid_status = ("ok", "healthy", "ready")
                            if isinstance(data, dict) and data.get("status") in valid_status:
                                return True, "Health check bem-sucedido"
                    except httpx.HTTPError as exc:
                        logger.debug("Falha na tentativa de health check em %s: %s", url, exc)
                        continue
        except httpx.HTTPError as exc:
            logger.debug("Erro de conexão durante probe em candidates locais: %s", exc)

        return await super().fast_probe(
            base_url=base_url,
            api_key=api_key,
            timeout_seconds=timeout_seconds,
        )

    async def list_models(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 5.0,
    ) -> list[str]:
        """
        Lista modelos disponíveis consultando o endpoint /v1/models local.

        Args:
            api_key: Chave de API opcional.
            base_url: Endpoint base local.
            timeout_seconds: Limite de tempo da requisição.

        Returns:
            Lista de identificadores de modelos encontrados.
        """
        if not base_url:
            return []

        target_base = base_url.rstrip("/")
        endpoints = [f"{target_base}/models"]
        if not target_base.endswith("/v1"):
            endpoints.append(f"{target_base}/v1/models")

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                for url in endpoints:
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            data = resp.json()
                            models = [m["id"] for m in data.get("data", []) if "id" in m]
                            if models:
                                return models
                    except httpx.HTTPError as exc:
                        logger.debug("Falha ao consultar listagem de modelos locais em %s: %s", url, exc)
                        continue
        except httpx.HTTPError as exc:
            logger.debug("Erro de conexão geral ao listar modelos locais: %s", exc)

        return []
