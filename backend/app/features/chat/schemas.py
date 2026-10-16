"""Schemas DTO para integração web do Agente Analítico."""

from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    """Requisição de pergunta em linguagem natural para o Agente."""

    pergunta: str = Field(..., description="Pergunta do usuário para análise analítica", min_length=1)
    thread_id: str | None = Field(default=None, description="Identificador único da thread de conversa")
    provider: str | None = Field(default=None, description="Provedor de inferência opcional (google, groq, mock, etc.)")
    model: str | None = Field(default=None, description="Modelo específico opcional")


class StreamErrorPayload(BaseModel):
    """Payload de erro emitido via SSE."""

    error: str
    error_code: str
    message: str


class ProactiveInsightsRequest(BaseModel):
    """Requisição de insights proativos baseados no contexto da tela e métricas."""

    tela: str = Field(..., description="Identificador da tela ou painel de contexto")
    metricas: dict[str, float | int | str] = Field(
        default_factory=dict,
        description="Métricas operacionais observadas na visualização atual",
    )


class ProactiveInsightsResponse(BaseModel):
    """Resposta com lista de insights analíticos e resumo executivo."""

    insights: list[str] = Field(..., description="Lista de achados proativos detectados")
    resumo_executivo: str = Field(..., description="Síntese executiva contextualizada")

