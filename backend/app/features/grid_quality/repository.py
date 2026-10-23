"""Acesso a dados da qualidade da rede: lê `fato_qualidade_alimentador` com a sessão assíncrona."""

import logging
from collections.abc import Mapping
from dataclasses import fields

from sqlalchemy import Select
from sqlalchemy.engine import Result
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.grid_quality.queries import (
    TABLE_NAME,
    competencia_rows_query,
    feeder_history_query,
    latest_competencia_query,
)
from app.features.grid_quality.rules import FeederQualityRow, FeederScope
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)
GOLD_TABLE_ERROR_MESSAGE = f"Falha ao consultar a tabela Gold {TABLE_NAME}."
SCOPE_COLUMNS = tuple(scope_field.name for scope_field in fields(FeederScope))


def _to_row(record: Mapping) -> FeederQualityRow:
    scope = FeederScope(**{column_name: record[column_name] for column_name in SCOPE_COLUMNS})
    row_columns = {column_name: value for column_name, value in record.items() if column_name not in SCOPE_COLUMNS}
    return FeederQualityRow(**row_columns, scope=scope)


class GridQualityRepository:
    """Consultas de DEC/FEC por alimentador sobre a tabela Gold do pipeline."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _execute(self, query: Select) -> Result:
        try:
            return await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar a tabela Gold %s.", TABLE_NAME)
            raise DatabaseReadError(GOLD_TABLE_ERROR_MESSAGE) from e

    async def fetch_latest_competencia(self) -> str | None:
        """Busca a competência mais recente com apuração.

        Returns:
            Competência no formato 'YYYY-MM', ou None se a tabela não tem apurações.

        Raises:
            DatabaseReadError: Se a tabela Gold estiver ausente ou fora do contrato.
        """
        result = await self._execute(latest_competencia_query())
        return result.scalar()

    async def fetch_rows(self, competencia: str) -> list[FeederQualityRow]:
        """Busca as apurações de todos os alimentadores em uma competência.

        Args:
            competencia: Competência no formato 'YYYY-MM'.

        Returns:
            Apurações da competência; lista vazia se não houver.

        Raises:
            DatabaseReadError: Se a tabela Gold estiver ausente ou fora do contrato.
        """
        result = await self._execute(competencia_rows_query(competencia))
        return [_to_row(record) for record in result.mappings()]

    async def fetch_history(self, id_alimentador: str, meses: int) -> list[FeederQualityRow]:
        """Busca as últimas apurações de um alimentador.

        Args:
            id_alimentador: Identificador do alimentador.
            meses: Quantidade máxima de competências.

        Returns:
            Apurações da mais antiga para a mais recente; lista vazia se o alimentador não existe.

        Raises:
            DatabaseReadError: Se a tabela Gold estiver ausente ou fora do contrato.
        """
        result = await self._execute(feeder_history_query(id_alimentador, meses))
        latest_first_rows = [_to_row(record) for record in result.mappings()]
        return list(reversed(latest_first_rows))
