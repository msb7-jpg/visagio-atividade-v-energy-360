"""Acesso a dados da Continuidade: executa as consultas agregadas em SQL e devolve linhas já somadas."""

import logging
from collections.abc import Collection

from sqlalchemy import Select
from sqlalchemy.engine import Result
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.grid_quality.continuity_queries import (
    affected_customers_query,
    cause_hours_query,
    feeder_ucs_query,
    latest_competencias_query,
    monthly_feeder_query,
    scope_query,
    type_count_query,
)
from app.features.grid_quality.continuity_rules import MonthlyFeederRow
from app.features.grid_quality.continuity_schemas import AffectedCustomerDTO
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)
GOLD_ERROR_MESSAGE = "Falha ao consultar as tabelas Gold da Continuidade."


class ContinuityRepository:
    """Consultas de continuidade sobre `fato_ocorrencias_rede`, `fato_qualidade_alimentador` e a dimensão de UC."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _execute(self, query: Select) -> Result:
        try:
            return await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception(GOLD_ERROR_MESSAGE)
            raise DatabaseReadError(GOLD_ERROR_MESSAGE) from e

    async def fetch_monthly(self) -> list[MonthlyFeederRow]:
        """UC-horas e ocorrências por alimentador e competência, na rede inteira (soma feita no SQL)."""
        result = await self._execute(monthly_feeder_query())
        return [MonthlyFeederRow(**record) for record in result.mappings()]

    async def fetch_feeder_ucs(self) -> dict[str, int]:
        """UCs atendidas por alimentador, uma vez por alimentador."""
        result = await self._execute(feeder_ucs_query())
        return {record["id_alimentador"]: record["ucs_atendidas"] for record in result.mappings()}

    async def fetch_scope(self, municipality_key: str | None) -> dict[str, str]:
        """Alimentadores do escopo e o município (chave do banco) de cada um; None traz a rede inteira."""
        result = await self._execute(scope_query(municipality_key))
        return {record["alimentador"]: record["municipio"] for record in result.mappings()}

    async def fetch_cause_hours(self, competencias: Collection[str], feeder_ids: Collection[str]) -> dict[str, float]:
        """UC-horas por causa nas competências e alimentadores informados."""
        result = await self._execute(cause_hours_query(competencias, feeder_ids))
        return {record["causa"]: record["uc_hours"] for record in result.mappings()}

    async def fetch_type_counts(self, competencias: Collection[str], feeder_ids: Collection[str]) -> dict[str, int]:
        """Ocorrências por tipo nas competências e alimentadores informados."""
        result = await self._execute(type_count_query(competencias, feeder_ids))
        return {record["tipo_ocorrencia"]: record["occurrences"] for record in result.mappings()}

    async def fetch_latest_competencias(self, meses: int) -> list[str]:
        """As últimas `meses` competências da série, da mais recente para a mais antiga."""
        result = await self._execute(latest_competencias_query(meses))
        return list(result.scalars())

    async def fetch_affected_customers(
        self, feeder_id: str, competencias: Collection[str], limite: int
    ) -> list[AffectedCustomerDTO]:
        """UCs do alimentador por horas sem energia nas competências, maiores primeiro."""
        result = await self._execute(affected_customers_query(feeder_id, competencias, limite))
        return [
            AffectedCustomerDTO(
                id_uc=record["id_uc"],
                nome_titular=record["nome_titular"],
                bairro=record["bairro"],
                municipio=record["municipio"],
                horas_sem_energia=record["uc_hours"],
                ocorrencias=record["occurrences"],
            )
            for record in result.mappings()
        ]
