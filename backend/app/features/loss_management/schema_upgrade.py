"""Atualiza a tabela `ordem_inspecao` de bancos já criados (o `create_all` não altera tabelas existentes).

Idempotente: só adiciona as colunas que ainda não existem, todas anuláveis, sem tocar nas linhas atuais.
Roda na subida da API e por `make db-upgrade` (`python -m app.features.loss_management.schema_upgrade`).
"""

import asyncio
import logging

from sqlalchemy import inspect
from sqlalchemy.engine import Connection

from app.core.logging import configure_logging
from app.db.session import engine
from app.features.loss_management.models import InspectionOrder

logger = logging.getLogger(__name__)

# Colunas acrescentadas depois da primeira versão da tabela (a ordem aqui é a ordem em que são criadas).
ADDED_COLUMN_NAMES = ("data_inspecao", "inspetor", "motivo_cancelamento")


def add_missing_columns(connection: Connection) -> list[str]:
    """Cria a tabela, se faltar, e acrescenta nela as colunas novas que ainda não existem.

    Args:
        connection: Conexão síncrona (use dentro de `AsyncConnection.run_sync`).

    Returns:
        Nomes das colunas adicionadas nesta chamada; vazio se o banco já estava atualizado.
    """
    InspectionOrder.metadata.create_all(connection)
    table_name = InspectionOrder.__tablename__
    existing_names = {column["name"] for column in inspect(connection).get_columns(table_name)}
    added: list[str] = []
    for column_name in ADDED_COLUMN_NAMES:
        if column_name in existing_names:
            continue
        column_type = InspectionOrder.__table__.c[column_name].type.compile(dialect=connection.dialect)
        connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
        added.append(column_name)
    return added


async def upgrade_inspection_table() -> list[str]:
    """Aplica `add_missing_columns` no banco da aplicação.

    Returns:
        Nomes das colunas adicionadas nesta chamada.
    """
    async with engine.begin() as connection:
        return await connection.run_sync(add_missing_columns)


async def run_upgrade_command() -> None:
    """Executa a atualização como comando e informa o que mudou."""
    try:
        added = await upgrade_inspection_table()
    finally:
        await engine.dispose()
    if added:
        logger.info("ordem_inspecao atualizada; colunas adicionadas: %s", ", ".join(added))
    else:
        logger.info("ordem_inspecao já está atualizada.")


if __name__ == "__main__":
    configure_logging()
    asyncio.run(run_upgrade_command())
