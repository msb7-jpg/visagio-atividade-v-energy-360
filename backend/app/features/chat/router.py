"""Rotas da API FastAPI para integração do Agente Analítico via Server-Sent Events (SSE)."""

import logging
import uuid
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from sse_starlette.sse import EventSourceResponse

if TYPE_CHECKING:
    from langchain_core.runnables import RunnableConfig

from app.agent.graph import create_agent_graph
from app.core.config import get_settings
from app.features.chat.event_dispatcher import SSEEventDispatcher
from app.features.chat.insights_service import generate_proactive_insights_service
from app.features.chat.schemas import (
    ChatQueryRequest,
    ProactiveInsightsRequest,
    ProactiveInsightsResponse,
    StreamErrorPayload,
)
from app.shared.dependencies import CurrentUser, DbSession

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Agente de Inteligência Artificial"])
settings = get_settings()

memory_checkpointer = MemorySaver()
agent_graph = create_agent_graph(checkpointer=memory_checkpointer)


@router.post("/chat/stream", summary="Conversar com o Agente Text-to-SQL via SSE")
async def chat_stream(
    request: ChatQueryRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> EventSourceResponse:
    """
    Processa a pergunta do usuário através da máquina de estados do LangGraph
    e transmite os eventos via SSE: session -> step_end -> thought -> sql -> data -> answer -> done.
    """
    del db
    raw_thread_id = request.thread_id or str(uuid.uuid4())
    session_thread_id = f"{current_user.id}:{raw_thread_id}"

    async def event_generator() -> AsyncIterator[dict[str, str]]:
        yield SSEEventDispatcher.emit_session(
            thread_id=raw_thread_id,
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
            "steps": [],
            "command": None,
        }

        runnable_config: RunnableConfig = {
            "configurable": {
                "provider": request.provider,
                "model": request.model,
                "base_url": settings.ai_base_url,
                "thread_id": session_thread_id,
                "role": current_user.role,
            }
        }

        try:
            async for chunk in agent_graph.astream(inputs, config=runnable_config, stream_mode="updates"):
                for node_name, update_payload in chunk.items():
                    events = SSEEventDispatcher.dispatch_node_updates(
                        node_name=node_name,
                        node_update=update_payload,
                    )
                    for evt in events:
                        yield evt

            yield SSEEventDispatcher.emit_done(thread_id=raw_thread_id)

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
    return await generate_proactive_insights_service(request)
