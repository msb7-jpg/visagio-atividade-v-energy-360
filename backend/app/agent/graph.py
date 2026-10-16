"""Orquestrador do Grafo de Execução do Agente Analítico via LangGraph."""

import inspect
import logging
import time
from collections.abc import Callable
from typing import Any

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.agent.nodes.chart_generator import chart_generator_node
from app.agent.nodes.corrector import sql_corrector_node
from app.agent.nodes.router_node import router_node
from app.agent.nodes.sql_executor import sql_executor_node
from app.agent.nodes.sql_generator import sql_generator_node
from app.agent.nodes.synthesizer import synthesizer_node
from app.agent.state import AgentState, AgentStateUpdate, AgentStepInfo, append_steps, append_thought
from app.core.constants import NODE_LABELS, AgentNode, SqlErrorCategory

logger = logging.getLogger(__name__)


def route_decision(state: AgentState) -> str:
    """Decide o próximo nó após a classificação inicial do router."""
    route = state.get("route", "sql")
    logger.info("Transição [route_decision]: rota='%s'", route)
    if route == "direct":
        return AgentNode.SYNTHESIZER.value
    return AgentNode.SQL_GENERATOR.value


def check_sql_execution(state: AgentState) -> str:
    """
    Decide o próximo nó após a execução SQL (sucesso para gráfico/síntese ou loop de autocorreção).
    """
    last_error = state.get("last_error")
    error_count = state.get("error_count", 0)
    error_cat = state.get("error_category")
    results = state.get("query_result")

    if not last_error:
        if results and len(results) > 0:
            logger.info(
                "Transição [check_sql_execution]: Sucesso SQL (%d linhas). Desviando para chart_generator.",
                len(results),
            )
            return AgentNode.CHART_GENERATOR.value
        logger.info("Transição [check_sql_execution]: Sucesso SQL sem linhas. Desviando para synthesizer.")
        return AgentNode.SYNTHESIZER.value

    # Recusas de segurança ou solicitações não suportadas vão direto para o sintetizador
    if error_cat in (
        SqlErrorCategory.SECURITY_VIOLATION,
        SqlErrorCategory.SECURITY_VIOLATION.value,
        SqlErrorCategory.UNSUPPORTED_REQUEST,
        SqlErrorCategory.UNSUPPORTED_REQUEST.value,
    ):
        logger.warning(
            "Transição [check_sql_execution]: Erro irrecuperável (%s). Desviando para synthesizer.",
            error_cat,
        )
        return AgentNode.SYNTHESIZER.value

    if error_count < 3:
        logger.warning(
            "Transição [check_sql_execution]: Falha sintática (tentativa %d/3). Desviando para sql_corrector: %s",
            error_count,
            last_error,
        )
        return AgentNode.SQL_CORRECTOR.value

    logger.error("Transição [check_sql_execution]: Limite de 3 tentativas excedido. Desviando para synthesizer.")
    return AgentNode.SYNTHESIZER.value


def _format_thought_text(thought: Any, label: str, is_router: bool) -> str | None:
    """Formata o texto de pensamento com prefixo de etapa e marcador de reset se for router."""
    if not thought:
        return "__RESET__" if is_router else None

    t_str = str(thought).strip()
    if not t_str.startswith(f"[{label}]"):
        t_str = f"[{label}]\n{t_str}"

    return f"__RESET__{t_str}" if is_router else t_str


def _build_wrapped_update(
    update_data: dict[str, Any] | None,
    node_name: str,
    label: str,
    duration_ms: int,
    is_router: bool,
    state: AgentState,
) -> AgentStateUpdate:
    """Aplica enriquecimento de telemetria, steps e thought ao payload retornado pelo nó."""
    update: dict[str, Any] = dict(update_data or {})
    step_info: AgentStepInfo = {
        "node": node_name,
        "label": label,
        "status": "done",
        "duration_ms": duration_ms,
    }
    update["steps"] = [step_info]

    formatted_thought = _format_thought_text(update.get("thought"), label, is_router)
    if formatted_thought is not None:
        update["thought"] = formatted_thought

    if update.get("messages"):
        all_steps = append_steps(state.get("steps"), [step_info])
        all_thought = append_thought(state.get("thought"), update.get("thought"))
        for msg in update["messages"]:
            if isinstance(msg, AIMessage):
                msg.additional_kwargs["steps"] = all_steps
                if all_thought:
                    msg.additional_kwargs["thought"] = all_thought

    return update  # type: ignore[return-value]


def _wrap_node(node_name: str, fn: Callable[..., Any]) -> Callable[..., Any]:
    """Encapsula nós do grafo injetando telemetria de latência e persistência de steps e thoughts."""
    label = NODE_LABELS.get(node_name, node_name)
    is_router = node_name == AgentNode.ROUTER.value

    if inspect.iscoroutinefunction(fn):

        async def async_wrapped(state: AgentState, config: RunnableConfig | None = None) -> AgentStateUpdate:
            thread_id = (config or {}).get("configurable", {}).get("thread_id", "local")
            logger.info("▶ [GRAFO:INÍCIO] nó='%s' (%s) thread_id=%s", node_name, label, thread_id)
            t0 = time.perf_counter()
            try:
                res = await fn(state, config)
            except Exception as exc:
                duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
                logger.error(
                    "✖ [GRAFO:FALHA] nó='%s' duration=%dms erro: %s",
                    node_name,
                    duration_ms,
                    exc,
                    exc_info=True,
                )
                raise
            duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            logger.info("✔ [GRAFO:CONCLUÍDO] nó='%s' duration=%dms", node_name, duration_ms)
            return _build_wrapped_update(res, node_name, label, duration_ms, is_router, state)

        return async_wrapped

    def sync_wrapped(state: AgentState, config: RunnableConfig | None = None) -> AgentStateUpdate:
        thread_id = (config or {}).get("configurable", {}).get("thread_id", "local")
        logger.info("▶ [GRAFO:INÍCIO] nó='%s' (%s) thread_id=%s", node_name, label, thread_id)
        t0 = time.perf_counter()
        try:
            res = fn(state) if getattr(fn, "__code__", None) and fn.__code__.co_argcount == 1 else fn(state, config)
        except Exception as exc:
            duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            logger.error(
                "✖ [GRAFO:FALHA] nó='%s' duration=%dms erro: %s",
                node_name,
                duration_ms,
                exc,
                exc_info=True,
            )
            raise
        duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
        logger.info("✔ [GRAFO:CONCLUÍDO] nó='%s' duration=%dms", node_name, duration_ms)
        return _build_wrapped_update(res, node_name, label, duration_ms, is_router, state)

    return sync_wrapped


def create_agent_graph(checkpointer: Any = None) -> CompiledStateGraph:
    """Compila o StateGraph completo com roteamento, SQL generator, executor, corrector, charts e synthesizer."""
    workflow = StateGraph(AgentState)

    # 1. Registro de todos os nós com telemetria
    nodes = [
        (AgentNode.ROUTER.value, router_node),
        (AgentNode.SQL_GENERATOR.value, sql_generator_node),
        (AgentNode.SQL_EXECUTOR.value, sql_executor_node),
        (AgentNode.SQL_CORRECTOR.value, sql_corrector_node),
        (AgentNode.CHART_GENERATOR.value, chart_generator_node),
        (AgentNode.SYNTHESIZER.value, synthesizer_node),
    ]
    for name, fn in nodes:
        workflow.add_node(name, _wrap_node(name, fn))

    # 2. Início: START -> ROUTER
    workflow.add_edge(START, AgentNode.ROUTER.value)

    # 3. Transição pós-router: direct -> SYNTHESIZER | sql -> SQL_GENERATOR
    workflow.add_conditional_edges(
        AgentNode.ROUTER.value,
        route_decision,
        {
            AgentNode.SQL_GENERATOR.value: AgentNode.SQL_GENERATOR.value,
            AgentNode.SYNTHESIZER.value: AgentNode.SYNTHESIZER.value,
        },
    )

    # 4. Pipeline SQL: Gerador -> Executor
    workflow.add_edge(AgentNode.SQL_GENERATOR.value, AgentNode.SQL_EXECUTOR.value)

    # 5. Avaliação pós-execução SQL (Autocorreção, Gráfico ou Síntese)
    workflow.add_conditional_edges(
        AgentNode.SQL_EXECUTOR.value,
        check_sql_execution,
        {
            AgentNode.SQL_CORRECTOR.value: AgentNode.SQL_CORRECTOR.value,
            AgentNode.CHART_GENERATOR.value: AgentNode.CHART_GENERATOR.value,
            AgentNode.SYNTHESIZER.value: AgentNode.SYNTHESIZER.value,
        },
    )

    # 6. Loop de autocorreção: Corrector -> Executor
    workflow.add_edge(AgentNode.SQL_CORRECTOR.value, AgentNode.SQL_EXECUTOR.value)

    # 7. Gráfico -> Síntese final
    workflow.add_edge(AgentNode.CHART_GENERATOR.value, AgentNode.SYNTHESIZER.value)

    # 8. Conclusão: Synthesizer -> END
    workflow.add_edge(AgentNode.SYNTHESIZER.value, END)

    return workflow.compile(checkpointer=checkpointer)
