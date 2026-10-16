"""Validador de Segurança SQL via AST (Read-Only Sandbox)."""

import re
from typing import TYPE_CHECKING

import sqlparse
from sqlparse.tokens import DDL, DML

from app.core.constants import SqlErrorCategory

if TYPE_CHECKING:
    from sqlparse.sql import Statement

DISALLOWED_STATEMENTS = {
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "CREATE",
    "REPLACE",
    "TRUNCATE",
    "ATTACH",
    "DETACH",
    "PRAGMA",
}
FORBIDDEN_TABLES = {"sqlite_master", "sqlite_sequence", "sqlite_stat1", "sqlite_temp_master"}


def validate_sql_query(
    query: str,
) -> tuple[bool, str | None, SqlErrorCategory | None]:
    """
    Valida sintaticamente uma query SQL para assegurar que é puramente de leitura.

    Regras:
    1. Apenas uma única declaração (bloqueio de semicolon injection).
    2. Apenas declarações SELECT ou CTEs (WITH).
    3. Nenhum comando de mutação (DDL/DML destrutivo).
    4. Proibição de acesso a tabelas de catálogo/sistema do SQLite.
    """
    cleaned = query.strip().rstrip(";")
    if not cleaned:
        return False, "Query SQL vazia.", SqlErrorCategory.RECOVERABLE_SYNTAX

    parsed = sqlparse.parse(cleaned)
    if not parsed:
        return False, "Não foi possível analisar a consulta SQL.", SqlErrorCategory.RECOVERABLE_SYNTAX

    if len(parsed) > 1:
        return (
            False,
            "Múltiplas instruções SQL não são permitidas. Envie apenas uma declaração.",
            SqlErrorCategory.SECURITY_VIOLATION,
        )

    stmt: Statement = parsed[0]
    first_token = stmt.get_type()

    clean_upper = cleaned.lstrip().upper()
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

    lower_query = cleaned.lower()
    for sys_tbl in FORBIDDEN_TABLES:
        if re.search(rf"\b{sys_tbl}\b", lower_query):
            return (
                False,
                f"Acesso proibido à tabela de sistema: '{sys_tbl}'.",
                SqlErrorCategory.SECURITY_VIOLATION,
            )

    return True, None, None
