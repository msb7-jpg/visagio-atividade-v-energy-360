"""Validador de Segurança SQL via AST (Read-Only Sandbox com suporte Multi-Query Seguro)."""

import re
from typing import TYPE_CHECKING

import sqlparse
from sqlparse.tokens import DDL, DML

from app.core.constants import SqlErrorCategory

if TYPE_CHECKING:
    from sqlparse.sql import Statement

MAX_STATEMENTS = 4

DISALLOWED_STATEMENTS = {
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "ATTACH",
    "DETACH",
    "PRAGMA",
}
FORBIDDEN_TABLES = {"sqlite_master", "sqlite_sequence", "sqlite_stat1", "sqlite_temp_master"}

QUERY_HEADER_PATTERN = re.compile(
    r"--\s*\[?(?:CONSULTA|QUERY|BLOCO)\s*\d*\s*[:\-]?\s*([^\]\n]+)\]?",
    re.IGNORECASE,
)


def _slugify_label(raw_label: str, default_index: int) -> str:
    """Converte o título de comentário de uma consulta em identificador tabular limpo."""
    cleaned_label = re.sub(r"[^a-zA-Z0-9_]+", "_", raw_label.strip().lower()).strip("_")
    if not cleaned_label:
        return f"consulta_{default_index}"
    return f"consulta_{default_index}_{cleaned_label[:32]}"


def split_and_extract_sql_queries(query: str) -> list[tuple[str, str]]:
    """
    Divide um bloco SQL em uma ou mais instruções individuais (SELECT/WITH) com seus rótulos.

    Args:
        query: String contendo uma ou até 4 instruções SQL separadas por ponto-e-vírgula.

    Returns:
        Lista de tuplas (rotulo_bloco, sql_limpo_sem_ponto_e_virgula).
    """
    raw_cleaned = query.strip()
    if not raw_cleaned:
        return []

    parsed_statements = sqlparse.parse(raw_cleaned)
    extracted_queries: list[tuple[str, str]] = []

    for stmt in parsed_statements:
        raw_stmt_text = str(stmt).strip()
        executable_sql = sqlparse.format(raw_stmt_text, strip_comments=True).strip().rstrip(";").strip()
        if not executable_sql:
            continue

        query_index = len(extracted_queries) + 1
        header_match = QUERY_HEADER_PATTERN.search(raw_stmt_text)
        label_name = (
            _slugify_label(header_match.group(1), query_index)
            if header_match
            else f"consulta_{query_index}"
        )
        extracted_queries.append((label_name, executable_sql))

    return extracted_queries


def _validate_single_statement(
    stmt: "Statement",
    executable_sql: str,
) -> tuple[bool, str | None, SqlErrorCategory | None]:
    """Valida individualmente a AST de uma única instrução SQL contra DDL/DML e tabelas de sistema."""
    first_token = stmt.get_type()
    clean_upper = executable_sql.lstrip().upper()
    is_select_or_with = clean_upper.startswith(("WITH", "SELECT"))

    if first_token not in ("SELECT", "UNKNOWN") and not is_select_or_with:
        return (
            False,
            f"Instrução não autorizada: '{first_token}'. Apenas SELECT e CTEs (WITH) são permitidas.",
            SqlErrorCategory.SECURITY_VIOLATION,
        )

    for token in stmt.flatten():
        token_value = token.value.upper()
        is_invalid_dml = token.ttype in (DML, DDL) and token_value not in ("SELECT", "WITH")
        if token_value in DISALLOWED_STATEMENTS or is_invalid_dml:
            return (
                False,
                f"Comando proibido detectado na consulta: '{token_value}'. Operações destrutivas são vetadas.",
                SqlErrorCategory.SECURITY_VIOLATION,
            )

    lower_query = executable_sql.lower()
    if re.search(r"\breplace\s+into\b", lower_query):
        return (
            False,
            "Comando proibido detectado na consulta: 'REPLACE INTO'. Operações destrutivas são vetadas.",
            SqlErrorCategory.SECURITY_VIOLATION,
        )

    for sys_tbl in FORBIDDEN_TABLES:
        if re.search(rf"\b{sys_tbl}\b", lower_query):
            return (
                False,
                f"Acesso proibido à tabela de sistema: '{sys_tbl}'.",
                SqlErrorCategory.SECURITY_VIOLATION,
            )

    return True, None, None


def validate_sql_query(
    query: str,
) -> tuple[bool, str | None, SqlErrorCategory | None]:
    """
    Valida sintaticamente uma ou até 4 queries SQL para assegurar execução puramente de leitura.

    Regras:
    1. Até 4 declarações analíticas por turno, todas individualmente validadas na AST.
    2. Apenas declarações SELECT ou CTEs (WITH).
    3. Nenhum comando de mutação (DDL/DML destrutivo).
    4. Proibição de acesso a tabelas de catálogo/sistema do SQLite.
    """
    cleaned = query.strip().rstrip(";")
    if not cleaned:
        return False, "Query SQL vazia.", SqlErrorCategory.RECOVERABLE_SYNTAX

    parsed_statements = sqlparse.parse(cleaned)
    if not parsed_statements:
        return False, "Não foi possível analisar a consulta SQL.", SqlErrorCategory.RECOVERABLE_SYNTAX

    executable_pairs: list[tuple[Statement, str]] = []
    for stmt in parsed_statements:
        exec_text = sqlparse.format(str(stmt), strip_comments=True).strip().rstrip(";").strip()
        if exec_text:
            executable_pairs.append((stmt, exec_text))

    if not executable_pairs:
        return False, "Query SQL vazia.", SqlErrorCategory.RECOVERABLE_SYNTAX

    if len(executable_pairs) > MAX_STATEMENTS:
        return (
            False,
            f"Múltiplas instruções SQL acima do limite permitido (máximo {MAX_STATEMENTS} consultas analíticas).",
            SqlErrorCategory.SECURITY_VIOLATION,
        )

    for stmt_obj, exec_sql in executable_pairs:
        is_valid, err_msg, err_cat = _validate_single_statement(stmt_obj, exec_sql)
        if not is_valid:
            return False, err_msg, err_cat

    return True, None, None
