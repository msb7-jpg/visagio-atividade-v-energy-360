from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.revenue.decomposition import SegmentTotals
from app.features.revenue.history import MonthlyTotals
from app.features.revenue.kpis import PeriodTotals, WindowTotals
from app.features.revenue.queries import monthly_totals_query, period_totals_query, segment_totals_query
from app.features.revenue.schemas import PeriodWindow, RevenueFilters
from app.shared.exceptions import DatabaseReadError


class RevenueRepository:
    """Leitura somente das tabelas Gold necessárias para decompor a receita."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_segment_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> list[SegmentTotals]:
        """Soma volume e receita por classe, município e bairro nas janelas base e atual.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Um item por segmento que teve faturamento em alguma das duas janelas.

        Raises:
            DatabaseReadError: Se as tabelas Gold não existirem ou a leitura falhar.
        """
        try:
            result = await self.session.execute(segment_totals_query(base, current, filters))
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler o faturamento agregado: {error.orig}") from error
        return [SegmentTotals(**row) for row in result.mappings()]

    async def fetch_period_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> PeriodTotals:
        """Soma receita, volume, faturas e UCs distintas nas janelas base e atual.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Totais gerais das duas janelas; sem faturamento, todos os valores são zero.

        Raises:
            DatabaseReadError: Se as tabelas Gold não existirem ou a leitura falhar.
        """
        try:
            result = await self.session.execute(period_totals_query(base, current, filters))
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler os totais de faturamento: {error.orig}") from error
        row = result.mappings().one()
        return PeriodTotals(
            base=WindowTotals(row["receita_base_rs"], row["volume_base_kwh"], row["faturas_base"], row["ucs_base"]),
            current=WindowTotals(
                row["receita_atual_rs"], row["volume_atual_kwh"], row["faturas_atual"], row["ucs_atual"]
            ),
        )

    async def fetch_monthly_totals(self, window: PeriodWindow, filters: RevenueFilters) -> list[MonthlyTotals]:
        """Soma volume e receita por competência na janela, para os filtros dados.

        Args:
            window: Janela de competências (início e fim incluídos).
            filters: Município, bairro e classe do recorte.

        Returns:
            Uma linha por competência que teve faturamento, da mais antiga para a mais nova.

        Raises:
            DatabaseReadError: Se as tabelas Gold não existirem ou a leitura falhar.
        """
        try:
            result = await self.session.execute(monthly_totals_query(window, filters))
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler o histórico mensal de faturamento: {error.orig}") from error
        return [MonthlyTotals(**row) for row in result.mappings()]