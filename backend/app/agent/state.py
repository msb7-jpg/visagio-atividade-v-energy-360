from typing import Annotated, Literal

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

from app.core.constants import AgentNode, QueryResultRow, SqlErrorCategory, StepStatus


class AgentStepInfo(TypedDict):
    """Informações de execução e profiling de cada nó do agente."""

    node: str
    status: StepStatus | Literal["pending", "active", "done", "error"]
    duration_ms: int | None
    label: str


def append_steps(
    existing: list[AgentStepInfo] | None,
    new: list[AgentStepInfo] | AgentStepInfo | None,
) -> list[AgentStepInfo]:
    """
    Combina ou anexa etapas de execução do agente preservando a ordem cronológica.
    Ao encontrar a etapa 'router', reinicializa os passos do turno corrente.
    """
    if not new:
        return list(existing or [])

    new_items: list[AgentStepInfo] = [new] if isinstance(new, dict) else list(new)

    # Início de um novo turno conversacional: reinicializa a lista deste turno
    if any(s.get("node") == AgentNode.ROUTER.value for s in new_items):
        return list(new_items)

    current = list(existing or [])
    for step_item in new_items:
        current = [s for s in current if s.get("node") != step_item.get("node")]
        current.append(step_item)
    return current


def append_thought(existing: str | None, new: str | None) -> str | None:
    """
    Concatena raciocínios intermediários gerados por diferentes etapas do pipeline analítico.
    Evita sobrescrita indesejada do contexto reflexivo do agente.
    """
    if not new:
        return existing

    if new.startswith("__RESET__"):
        clean = new.replace("__RESET__", "").strip()
        return clean or None

    if not existing:
        return new

    if new in existing:
        return existing

    return f"{existing}\n\n{new}"


RouteType = Literal["sql", "direct"]


class SlashCommandInfo(TypedDict, total=False):
    """Metadados de comando de barra capturado na mensagem do usuário."""

    name: str
    args: str | None


class AgentState(TypedDict):
    """
    Estado do LangGraph para o Agente Text-to-SQL.
    Utiliza o reducer add_messages para gerenciar o histórico conversacional de forma imutável.
    """

    messages: Annotated[list[BaseMessage], add_messages]
    route: RouteType | None
    thought: Annotated[str | None, append_thought]
    generated_sql: str | None
    query_result: list[QueryResultRow] | None
    error_count: int
    last_error: str | None
    error_category: SqlErrorCategory | None
    steps: Annotated[list[AgentStepInfo], append_steps]
    command: SlashCommandInfo | None


class AgentStateUpdate(TypedDict, total=False):
    """Atualização parcial retornada pelos nós do LangGraph."""

    messages: list[BaseMessage]
    route: RouteType | None
    thought: str | None
    generated_sql: str | None
    query_result: list[QueryResultRow] | None
    error_count: int
    last_error: str | None
    error_category: SqlErrorCategory | None
    steps: list[AgentStepInfo]
    command: SlashCommandInfo | None
