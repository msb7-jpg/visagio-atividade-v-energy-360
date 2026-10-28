import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from app.agent.prompts import (
    SYNTHESIZER_PROMPT,
    TABLE_PRESENT_PROMPT,
)
from app.agent.state import AgentState, AgentStateUpdate
from app.agent.utils.toon_serializer import serialize_to_toon_tabular
from app.core.llm_factory import get_chat_model

logger = logging.getLogger(__name__)


def _build_context_info(state: AgentState) -> str:
    """Monta a string descritiva de contexto para injeção no prompt do sintetizador."""
    route = state.get("route", "sql")
    generated_sql = state.get("generated_sql")
    query_result = state.get("query_result")
    last_error = state.get("last_error")
    error_category = state.get("error_category")

    context_info = f"Rota: {route}\n"

    if generated_sql:
        context_info += f"SQL Executado:\n```sql\n{generated_sql}\n```\n"

    if query_result is not None:
        sample_results = query_result[:30]
        toon_data = serialize_to_toon_tabular("dados_analiticos", sample_results)
        context_info += f"Dados Retornados ({len(query_result)} linhas):\n{toon_data}\n"

    if last_error:
        context_info += f"Houve um erro na execução: {last_error}\n"
        if error_category:
            context_info += f"Categoria do Erro: {error_category}\n"

    return context_info


def _build_additional_kwargs(state: AgentState, configurable: dict[str, Any]) -> dict[str, Any]:
    """Constrói o dicionário additional_kwargs para persistência na AIMessage."""
    additional_kwargs: dict[str, Any] = {}
    for key in ("provider", "model"):
        param_value = configurable.get(key)
        if param_value:
            additional_kwargs[key] = param_value

    for key in ("thought", "generated_sql", "steps"):
        state_value = state.get(key)
        if state_value:
            additional_kwargs[key] = state_value

    return additional_kwargs


async def synthesizer_node(state: AgentState, config: RunnableConfig | None = None) -> AgentStateUpdate:
    """
    Sintetiza a resposta executiva final em Markdown para o usuário.

    Args:
        state: Estado consolidado contendo histórico, query_result e last_error.
        config: Configuração do runner com provedor e credenciais.

    Returns:
        Atualização parcial do estado contendo a mensagem AIMessage sintetizada.
    """
    messages = state["messages"]

    configurable = (config or {}).get("configurable", {})
    llm = get_chat_model(
        provider=configurable.get("provider"),
        model=configurable.get("model"),
        api_key=configurable.get("api_key"),
        base_url=configurable.get("base_url"),
        timeout_seconds=configurable.get("timeout_seconds") or 30,
        temperature=0.3,
    )

    context_info = _build_context_info(state)

    analytics_data = state.get("query_result")
    total_records = len(analytics_data) if analytics_data else 0
    logger.info(
        "Iniciando síntese executiva: rota='%s', registros=%d",
        state.get("route"),
        total_records,
    )

    full_prompt = f"{SYNTHESIZER_PROMPT}\n\n{TABLE_PRESENT_PROMPT}\n\n[CONTEXTO DOS DADOS]\n{context_info}"
    system_msg = SystemMessage(content=full_prompt)
    llm_input = [system_msg, *messages]

    response = await llm.ainvoke(llm_input)
    ai_content = response.content if isinstance(response.content, str) else str(response.content)

    logger.info("Síntese executiva concluída (%d caracteres gerados).", len(ai_content))
    additional_kwargs = _build_additional_kwargs(state, configurable)

    return {"messages": [AIMessage(content=ai_content, additional_kwargs=additional_kwargs)]}
