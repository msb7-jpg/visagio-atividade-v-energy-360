import re
import sqlite3

from langchain_core.tools import tool

from app.agent.nodes.sql_validator import split_and_extract_sql_queries
from app.core.constants import QueryResultRow
from app.db.session import get_readonly_db_connection
from app.shared.exceptions import DatabaseReadError

FORBIDDEN_KEYWORDS_PATTERN = re.compile(
    r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|ATTACH|DETACH|CREATE|REPLACE\s+INTO|PRAGMA|VACUUM|REINDEX)\b",
    re.IGNORECASE,
)


def _validate_statement_text(statement_sql: str) -> None:
    """Garante que uma instrução SQL individual é SELECT ou WITH e sem palavras-chave destrutivas."""
    if FORBIDDEN_KEYWORDS_PATTERN.search(statement_sql):
        raise ValueError("Operação proibida: a consulta contém comandos de modificação de dados ou DDL.")

    upper_clean = statement_sql.lstrip().upper()
    if not upper_clean.startswith(("SELECT", "WITH")):
        raise ValueError("Apenas consultas que iniciem com SELECT ou WITH são permitidas.")


@tool
def execute_sql_query(query: str) -> list[QueryResultRow]:
    """
    Executa uma ou até 4 consultas analíticas SQL em modo estritamente read-only (SELECT/WITH) no SQLite.

    Args:
        query: Consulta(s) SQL a ser(em) executada(s). Cada instrução deve iniciar com SELECT ou WITH.

    Returns:
        Lista de dicionários QueryResultRow representando as linhas retornadas.
        Quando múltiplas consultas são executadas, cada linha inclui '_bloco_consulta' identificando a origem.

    Raises:
        ValueError: Se qualquer consulta contiver comandos de modificação/DDL ou não iniciar com SELECT/WITH.
        DatabaseReadError: Se ocorrer uma falha operacional de consulta no SQLite.
    """
    extracted_queries = split_and_extract_sql_queries(query)
    if not extracted_queries:
        raise ValueError("Apenas consultas que iniciem com SELECT ou WITH são permitidas.")

    for _, statement_sql in extracted_queries:
        _validate_statement_text(statement_sql)

    try:
        with get_readonly_db_connection() as conn:
            cursor = conn.cursor()
            if len(extracted_queries) == 1:
                _, single_sql = extracted_queries[0]
                cursor.execute(single_sql)
                single_rows = cursor.fetchmany(100)
                return [dict(row_record) for row_record in single_rows]

            combined_rows: list[QueryResultRow] = []
            for label_name, statement_sql in extracted_queries:
                cursor.execute(statement_sql)
                batch_rows = cursor.fetchmany(50)
                for row_record in batch_rows:
                    tagged_row: QueryResultRow = {"_bloco_consulta": label_name, **dict(row_record)}
                    combined_rows.append(tagged_row)
            return combined_rows
    except sqlite3.OperationalError as e:
        raise DatabaseReadError(f"Erro de execução SQLite: {e}") from e
