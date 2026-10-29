"""Constantes de domínio, enums e categorias de erro da aplicação."""

from enum import StrEnum

# Tipos de valores escalares retornados por queries SQLite
type SqlScalar = str | int | float | bool | None
type QueryResultRow = dict[str, SqlScalar]


class UserRole(StrEnum):
    """Papéis de usuários no sistema com RBAC."""

    DIRETOR = "diretor"
    GERENTE_OPERACAO = "gerente_operacao"
    GERENTE_ATENDIMENTO = "gerente_atendimento"
    GERENTE_PERDAS = "gerente_perdas"
    ATENDENTE = "atendente"


class LLMProvider(StrEnum):
    """Provedores de Large Language Models suportados pelo sistema."""

    GOOGLE = "google"
    GROQ = "groq"
    LOCAL = "local"
    OPENROUTER = "openrouter"
    MOCK = "mock"


SUPPORTED_PROVIDERS: tuple[str, ...] = tuple(p.value for p in LLMProvider)


class AgentNode(StrEnum):
    """Nós do grafo de execução orquestrado via LangGraph."""

    ROUTER = "router"
    SQL_GENERATOR = "sql_generator"
    SQL_VALIDATOR = "sql_validator"
    SQL_EXECUTOR = "sql_executor"
    SQL_CORRECTOR = "sql_corrector"
    SYNTHESIZER = "synthesizer"


NODE_LABELS: dict[str, str] = {
    AgentNode.ROUTER.value: "Classificando intenção",
    AgentNode.SQL_GENERATOR.value: "Escrevendo consulta SQL",
    AgentNode.SQL_VALIDATOR.value: "Validando integridade da query",
    AgentNode.SQL_EXECUTOR.value: "Executando no banco de dados",
    AgentNode.SQL_CORRECTOR.value: "Auto-corrigindo consulta SQL",
    AgentNode.SYNTHESIZER.value: "Formatando resposta analítica",
}


class SSEEventType(StrEnum):
    """Tipos de eventos Server-Sent Events (SSE) despachados ao cliente."""

    SESSION = "session"
    DONE = "done"
    TITLE = "title"
    ERROR = "error"
    STEP_END = "step_end"
    THOUGHT = "thought"
    SQL = "sql"
    DATA = "data"
    TOKEN = "token"  # ruff: ignore[hardcoded-password-string]
    ANSWER = "answer"


class StepStatus(StrEnum):
    """Status de execução de uma etapa do agente."""

    PENDING = "pending"
    ACTIVE = "active"
    DONE = "done"
    ERROR = "error"


class SqlErrorCategory(StrEnum):
    """Categorização de erros sintáticos ou de segurança em consultas SQL."""

    SECURITY_VIOLATION = "SECURITY_VIOLATION"
    RECOVERABLE_SYNTAX = "RECOVERABLE_SYNTAX"
    UNSUPPORTED_REQUEST = "UNSUPPORTED_REQUEST"
    RUNTIME_EXECUTION = "RUNTIME_EXECUTION"


class StreamErrorCode(StrEnum):
    """Códigos padronizados de erro emitidos no stream SSE."""

    RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED"
    UNAUTHORIZED = "UNAUTHORIZED"
    CONNECTION_REFUSED = "CONNECTION_REFUSED"
    DATABASE_ERROR = "DATABASE_ERROR"
    SQL_SYNTAX_ERROR = "SQL_SYNTAX_ERROR"
    AGENT_ERROR = "AGENT_ERROR"
