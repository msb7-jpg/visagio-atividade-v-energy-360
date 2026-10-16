import logging
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel, SimpleChatModel
from langchain_core.messages import BaseMessage

from app.core.llm_factory.base import LLMProviderStrategy

logger = logging.getLogger(__name__)


class GroundedMockChatModel(SimpleChatModel):
    """Modelo mock determinístico para testes e execução offline do ciclo analítico."""

    custom_response: str | None = None

    @property
    def _llm_type(self) -> str:
        return "grounded_mock"

    def _call(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        **kwargs: Any,
    ) -> str:
        del stop, kwargs
        if self.custom_response:
            return self.custom_response

        # Analisa o contexto da mensagem para emitir respostas semânticas adequadas
        all_text = " ".join(str(m.content) for m in messages).lower()

        # 1. Roteamento de intenção
        if "classifique-a estritamente" in all_text or "classificador de intenção" in all_text:
            user_text = str(messages[-1].content).lower() if messages else ""
            if any(term in user_text for term in ("olá", "ajuda", "quem é você", "bom dia", "hello", "hi")):
                return "direct"
            return "sql"

        # 2. Correção de SQL
        if "consulta anterior com falha" in all_text or "auto-recuperação" in all_text:
            return (
                "<thought>Ajustando a sintaxe da consulta com base no erro reportado.</thought>\n\n"
                "```sql\nSELECT 'Corrigido' AS status, 150 AS valor;\n```"
            )

        # 3. Geração de SQL
        if "agente analítico especialista em sql" in all_text or "schema do banco" in all_text:
            return (
                "<thought>Analisando solicitação analítica e formulando consulta SQL.</thought>\n\n"
                "```sql\nSELECT 'Operacional' AS categoria, 25000 AS consumo;\n```"
            )

        # 4. Avaliação de Gráficos
        if "visualização gráfica" in all_text or "chartjsconfigdto" in all_text:
            return (
                '{"type": "bar", "title": "Distribuição de Consumo", "labels": ["Residencial", "Comercial"], '
                '"datasets": [{"label": "Consumo kWh", "data": [12000, 13000]}]}'
            )

        # 5. Síntese final
        return (
            "### Análise Operacional e Executiva\n\n"
            "Com base nas informações consolidadas no banco de dados, os indicadores operacionais "
            "apresentam conformidade com os padrões estabelecidos."
        )

    async def _acall(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        **kwargs: Any,
    ) -> str:
        return self._call(messages, stop=stop, **kwargs)


class GroundedMockStrategy(LLMProviderStrategy):
    """Estratégia determinística offline para testes do StateGraph."""

    def create_model(
        self,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: int = 30,
        **kwargs: Any,
    ) -> BaseChatModel:
        del model, api_key, base_url, temperature, timeout_seconds
        custom_response = kwargs.get("custom_response")
        return GroundedMockChatModel(custom_response=custom_response)

    async def list_models(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 5.0,
    ) -> list[str]:
        del api_key, base_url, timeout_seconds
        return ["mock-analytical-model"]
