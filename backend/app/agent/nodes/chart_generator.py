import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from app.agent.prompts import CHART_DECISION_SYSTEM_PROMPT
from app.agent.schemas.chart_schema import ChartDataset, ChartJsConfigDTO
from app.agent.state import AgentState, AgentStateUpdate
from app.core.constants import ChartType, QueryResultRow
from app.core.llm_factory import get_chat_model

logger = logging.getLogger(__name__)

TECHNICAL_ID_COLUMNS = {
    "id",
    "sk_",
    "_id",
    "cpf",
    "cnpj",
    "protocolo",
}


def _is_technical_id(col_name: str) -> bool:
    """Verifica se a coluna é um ID técnico que não deve ser usado como rótulo de gráfico."""
    lower = col_name.lower()
    return any(t in lower for t in TECHNICAL_ID_COLUMNS)


def _detect_chart_type(query_lower: str, forced_type: str | None = None) -> ChartType:
    """Determina o tipo de gráfico baseado em argumento forçado ou palavras-chave."""
    if forced_type:
        ft = forced_type.lower().strip()
        if ft in ("line", "linha", "temporal"):
            return ChartType.LINE
        if ft in ("pie", "pizza"):
            return ChartType.PIE
        if ft in ("doughnut", "rosca"):
            return ChartType.DOUGHNUT
        if ft in ("bar", "barra", "barras"):
            return ChartType.BAR

    if any(keyword in query_lower for keyword in ("linha", "temporal", "evolução", "evolucao", "histórico", "mes")):
        return ChartType.LINE
    if "rosca" in query_lower:
        return ChartType.DOUGHNUT
    if any(keyword in query_lower for keyword in ("pizza", "distribuição", "distribuicao", "proporção")):
        return ChartType.PIE
    return ChartType.BAR


def _heuristic_chart_builder(
    user_query: str,
    query_result: list[QueryResultRow],
    forced_type: str | None = None,
) -> dict[str, Any] | None:
    """Constrói especificação de gráfico determinística se houver rótulo e métrica claros."""
    if not query_result or not isinstance(query_result, list) or len(query_result) < 2:
        return None

    first_row = query_result[0]
    keys = list(first_row.keys())
    if len(keys) < 2:
        return None

    # Encontra coluna de rótulo (texto ou categoria que não seja ID técnico)
    label_col: str | None = None
    for col_key in keys:
        if not _is_technical_id(col_key) and isinstance(first_row[col_key], str):
            label_col = col_key
            break
    if not label_col:
        label_col = keys[0]

    # Encontra coluna numérica
    metric_col: str | None = None
    for col_key in keys:
        if col_key != label_col and not _is_technical_id(col_key) and isinstance(first_row[col_key], (int, float)):
            metric_col = col_key
            break

    if not metric_col:
        return None

    labels = [str(row.get(label_col, "")) for row in query_result[:15]]
    data = [float(row.get(metric_col, 0) or 0) for row in query_result[:15]]

    chart_type = _detect_chart_type(user_query.lower(), forced_type=forced_type)
    metric_name = metric_col.replace("_", " ").title()
    title = f"{metric_name} por {label_col.replace('_', ' ').title()}"

    dto = ChartJsConfigDTO(
        type=chart_type.value,
        title=title,
        labels=labels,
        datasets=[ChartDataset(label=metric_name, data=data)],
    )
    return dto.model_dump()


def check_explicit_chart_intent(query: str) -> bool:
    """Verifica se há intenção explícita de visualização gráfica."""
    lower_query = query.lower()
    keywords = (
        "/chart",
        "gráfico",
        "grafico",
        "chart",
        "plot",
        "pizza",
        "doughnut",
        "barras",
        "linhas",
        "visualização",
        "visualizacao",
    )
    return any(keyword in lower_query for keyword in keywords)


async def _evaluate_chart_with_llm(
    llm: Any,
    last_user_query: str,
    query_result: list[QueryResultRow],
) -> dict[str, Any] | None:
    """Consulta o LLM para decidir e estruturar o payload do gráfico."""
    sample_data = query_result[:10]
    sample_json = json.dumps(sample_data, ensure_ascii=False)
    prompt_payload = (
        f"Pergunta do usuário: '{last_user_query}'\n"
        f"Amostra dos dados analíticos ({len(query_result)} linhas totais):\n{sample_json}"
    )
    try:
        response = await llm.ainvoke([
            SystemMessage(content=CHART_DECISION_SYSTEM_PROMPT),
            HumanMessage(content=prompt_payload),
        ])
        content = str(response.content).strip()
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()

        parsed = json.loads(content)
        if parsed.get("has_chart") is False or not parsed.get("datasets"):
            return None

        return ChartJsConfigDTO(**parsed).model_dump()
    except Exception as exc:
        logger.warning("Falha ao avaliar gráfico via LLM (%s).", exc)
        return None


async def chart_generator_node(state: AgentState, config: RunnableConfig | None = None) -> AgentStateUpdate:
    """
    Avalia se os resultados analíticos devem ser transformados em visualização gráfica.
    """
    query_result = state.get("query_result")
    if not query_result or len(query_result) < 2:
        return {"chart_spec": None}

    messages = state.get("messages", [])
    last_user_query = ""
    for msg in reversed(messages):
        if getattr(msg, "type", "") == "human" or msg.__class__.__name__ == "HumanMessage":
            last_user_query = str(msg.content)
            break

    command = state.get("command")
    forced_type = command.get("args") if (command and command.get("name") == "chart") else None

    # 1. Tenta construção determinística rápida
    heuristic_spec = _heuristic_chart_builder(last_user_query, query_result, forced_type=forced_type)
    explicit_intent = check_explicit_chart_intent(last_user_query) or (command and command.get("name") == "chart")

    if heuristic_spec and explicit_intent:
        logger.info("Gráfico gerado com sucesso via heurística determinística.")
        return {"chart_spec": heuristic_spec}

    # 2. Se houver dados tabulares razoáveis, avalia via LLM
    configurable = (config or {}).get("configurable", {})
    llm = get_chat_model(
        provider=configurable.get("provider"),
        model=configurable.get("model"),
        api_key=configurable.get("api_key"),
        base_url=configurable.get("base_url"),
        timeout_seconds=configurable.get("timeout_seconds") or 30,
        temperature=0.0,
    )

    llm_spec = await _evaluate_chart_with_llm(llm, last_user_query, query_result)
    if llm_spec:
        logger.info("Gráfico especificado com sucesso via LLM.")
        return {"chart_spec": llm_spec}

    return {"chart_spec": heuristic_spec if explicit_intent else None}
