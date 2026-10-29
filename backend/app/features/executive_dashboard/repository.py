from dataclasses import fields

from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.executive_dashboard.indicators import AreaTotals
from app.features.executive_dashboard.queries import (
    AREA_QUERIES,
    SUFFIX_ATUAL,
    SUFFIX_BASE,
    available_period_query,
)
from app.features.grid_quality.continuity_queries import feeder_ucs_query
from app.features.loss_management.queries import latest_competencia_query
from app.features.revenue.schemas import PeriodWindow
from app.shared.exceptions import DatabaseReadError

AREA_FIELDS = tuple(area_field.name for area_field in fields(AreaTotals))


def area_totals(row: dict[str, object], suffix: str) -> AreaTotals:
    """Separa da linha combinada os totais de uma das janelas (`base` ou `atual`)."""
    return AreaTotals(**{field_name: row[f"{field_name}_{suffix}"] for field_name in AREA_FIELDS})


class ExecutiveDashboardRepository:
    """Leitura somente das tabelas Gold de cobrança, rede, atendimento, medição e cadastro."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_area_totals(self, base: PeriodWindow, current: PeriodWindow) -> tuple[AreaTotals, AreaTotals]:
        """Soma as métricas de cada área nas janelas base e atual.

        Args:
            base: Janela de referência.
            current: Janela comparada.

        Returns:
            Os totais da janela base e da janela atual; sem dados, contagens zero e médias vazias.

        Raises:
            DatabaseReadError: Se uma tabela Gold não existir ou a leitura falhar, nomeando a tabela.
        """
        combined_row: dict[str, object] = {}
        for table_name, build_query in AREA_QUERIES.items():
            try:
                result = await self.session.execute(build_query(base, current))
            except OperationalError as error:
                raise DatabaseReadError(f"Falha ao ler a tabela Gold {table_name}: {error.orig}") from error
            combined_row.update(result.mappings().one())
        served_units = await self.fetch_served_units()
        combined_row[f"ucs_atendidas_{SUFFIX_BASE}"] = served_units
        combined_row[f"ucs_atendidas_{SUFFIX_ATUAL}"] = served_units
        return area_totals(combined_row, SUFFIX_BASE), area_totals(combined_row, SUFFIX_ATUAL)

    async def fetch_served_units(self) -> int:
        """UCs atendidas pela rede: soma das UCs de cada alimentador, a mesma base da Qualidade da Rede (ADR-025).

        Raises:
            DatabaseReadError: Se a tabela de qualidade por alimentador não existir.
        """
        try:
            result = await self.session.execute(feeder_ucs_query())
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler a tabela Gold fato_qualidade_alimentador: {error.orig}") from error
        return int(sum(row.ucs_atendidas or 0 for row in result))

    async def fetch_available_period(self) -> PeriodWindow | None:
        """Primeira e última competência com faturamento.

        Returns:
            A janela coberta pelos dados; None se ainda não há faturas.

        Raises:
            DatabaseReadError: Se a tabela de faturamento não existir.
        """
        try:
            row = (await self.session.execute(available_period_query())).one()
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler a tabela Gold fato_faturamento: {error.orig}") from error
        if row.inicio is None or row.fim is None:
            return None
        return PeriodWindow(competencia_inicio=row.inicio, competencia_fim=row.fim)

    async def fetch_latest_measurement(self) -> str | None:
        """Competência mais recente com medição, a mesma em que a Fila de Perdas é calculada.

        Raises:
            DatabaseReadError: Se a tabela de medição não existir.
        """
        try:
            return await self.session.scalar(latest_competencia_query())
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler a tabela Gold fato_medicao: {error.orig}") from error
