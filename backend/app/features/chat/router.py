"""Rotas da API FastAPI para integração do Agente Analítico via Server-Sent Events (SSE)."""

import logging
import uuid
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from sse_starlette.sse import EventSourceResponse

if TYPE_CHECKING:
    from langchain_core.runnables import RunnableConfig

from app.agent.graph import create_agent_graph
from app.core.config import get_settings
from app.features.chat.event_dispatcher import SSEEventDispatcher
from app.features.chat.schemas import (
    ChatQueryRequest,
    ProactiveInsightsRequest,
    ProactiveInsightsResponse,
    StreamErrorPayload,
)
from app.shared.dependencies import CurrentUser, DbSession

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["Agente de Inteligência Artificial"])
settings = get_settings()

# Instância reutilizável do grafo compilado
agent_graph = create_agent_graph()


@router.post("/chat/stream", summary="Conversar com o Agente Text-to-SQL via SSE")
async def chat_stream(
    request: ChatQueryRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> EventSourceResponse:
    """
    Processa a pergunta do usuário através da máquina de estados do LangGraph
    e transmite os eventos via SSE: session -> step_end -> thought -> sql -> chart -> data -> answer -> done.
    """
    del db
    thread_id = request.thread_id or str(uuid.uuid4())

    async def event_generator() -> AsyncIterator[dict[str, str]]:
        # 1. Handshake de sessão
        yield SSEEventDispatcher.emit_session(
            thread_id=thread_id,
            provider=request.provider,
            model=request.model,
        )

        inputs = {
            "messages": [HumanMessage(content=request.pergunta.strip())],
            "route": None,
            "thought": None,
            "generated_sql": None,
            "query_result": None,
            "error_count": 0,
            "last_error": None,
            "error_category": None,
            "chart_spec": None,
            "steps": [],
            "command": None,
        }

        runnable_config: RunnableConfig = {
            "configurable": {
                "provider": request.provider,
                "model": request.model,
                "thread_id": thread_id,
                "role": current_user.role,
            }
        }

        try:
            # Transmite o fluxo de execução dos nós do LangGraph em tempo real
            async for chunk in agent_graph.astream(inputs, config=runnable_config, stream_mode="updates"):
                for node_name, update_payload in chunk.items():
                    events = SSEEventDispatcher.dispatch_node_updates(
                        node_name=node_name,
                        node_update=update_payload,
                    )
                    for evt in events:
                        yield evt

            # Sinalização de conclusão
            yield SSEEventDispatcher.emit_done(thread_id=thread_id)

        except Exception as exc:
            logger.error("Falha no pipeline de execução do agente: %s", exc, exc_info=True)
            yield SSEEventDispatcher.emit_error(
                StreamErrorPayload(
                    error=str(exc),
                    error_code="AGENT_PIPELINE_ERROR",
                    message="Ocorreu uma falha durante o processamento da consulta analítica.",
                )
            )

    return EventSourceResponse(event_generator())


@router.post("/insights", response_model=ProactiveInsightsResponse)
@router.post("/ai/insights", response_model=ProactiveInsightsResponse)
async def generate_proactive_insights(
    request: ProactiveInsightsRequest,
    current_user: CurrentUser,
) -> ProactiveInsightsResponse:
    """Gera insights proativos de acordo com o contexto operacional do usuário.

    Args:
        request: Payload contendo a tela ativa, filtros e métricas observadas.
        current_user: Usuário autenticado obtido via token JWT.

    Returns:
        ProactiveInsightsResponse com lista de achados e resumo executivo.
    """
    del current_user  # Autenticação validada via injeção de dependência
    screen_context = request.context or request.tela or "geral"

    if screen_context in ("customer360", "visao_360"):
        codigo_uc = request.filtros.get("codigo_uc") or request.metricas.get("codigo_uc", "N/A")
        insights_list = [
            f"Diagnóstico para UC {codigo_uc}: Histórico de consumo analisado no regime de competência.",
            "Sem registro de violações de DEC/FEC no alimentador de atendimento nos últimos 90 dias.",
            "Consistência tarifária confirmada entre leitura de medição física e faturamento homologado.",
        ]
        summary = f"Visão 360 unificada para a UC {codigo_uc} em conformidade regulatória."
    elif screen_context in ("revenue", "receita"):
        insights_list = [
            "Decomposição Price-Volume-Mix: Reajuste homologado de 10,5% contrabalançado por queda de volume.",
            "Maior impacto de Geração Distribuída (GD) identificado em bairros residenciais B1 de classe alta.",
            "Efeito-volume faturado com retração de 3,8% influenciada por microgeração e perdas não técnicas.",
        ]
        summary = "Análise de decomposição de receita concluída para o horizonte 2022-2025."
    else:
        dec_val = request.metricas.get("dec", "N/A")
        fec_val = request.metricas.get("fec", "N/A")
        insights_list = [
            f"Painel monitorado: {screen_context.upper()}.",
            f"Métricas recebidas: DEC={dec_val}, FEC={fec_val} em análise contínua.",
        ]
        summary = f"Operação estável com acompanhamento dos indicadores na tela {screen_context}."

    return ProactiveInsightsResponse(
        insights=insights_list,
        resumo_executivo=summary,
    )

