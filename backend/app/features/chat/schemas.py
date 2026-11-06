"""Schemas DTO para integração web do Agente Analítico."""

from typing import Literal

from pydantic import BaseModel, Field

InsightTone = Literal["positivo", "neutro", "atencao", "critico"]


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

    context: str | None = Field(default=None, description="Contexto de tela (customer360, revenue, losses, quality)")
    tela: str | None = Field(default=None, description="Alias compatível com contexto de tela")
    metricas: dict[str, float | int | str] = Field(
        default_factory=dict,
        description="Métricas operacionais observadas na visualização atual",
    )
    filtros: dict[str, str | int | float | None] = Field(
        default_factory=dict,
        description="Filtros operacionais aplicados (municipio, bairro, alimentador, etc.)",
    )


class InsightHighlight(BaseModel):
    """Número de destaque do insight: a IA escolhe a métrica e o rótulo; o valor vem das métricas do servidor."""

    rotulo: str = Field(..., description="Rótulo curto do número (até 40 caracteres)")
    metrica: str = Field(..., description="Nome da métrica do servidor de onde o valor foi copiado")
    valor: float | int | str = Field(..., description="Valor da métrica, copiado sem alteração")
    unidade: str | None = Field(default=None, description="rs, rs_kwh, kwh, pct, pp, horas, vezes, ucs, nota ou nulo")


class ProactiveInsightsResponse(BaseModel):
    """Resposta com lista de insights analíticos e resumo executivo."""

    insights: list[str] = Field(..., description="Lista de achados proativos detectados")
    resumo_executivo: str = Field(..., description="Síntese executiva contextualizada")
    manchete: str | None = Field(default=None, description="Resposta direta em uma frase curta")
    tom: InsightTone = Field(default="neutro", description="Leitura geral: positivo, neutro, atenção ou crítico")
    destaques: list[InsightHighlight] = Field(default_factory=list, description="Até três números de destaque")
    acao_recomendada: str | None = Field(default=None, description="Próximo passo sugerido, em uma frase")

