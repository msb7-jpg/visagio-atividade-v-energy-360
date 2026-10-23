from collections.abc import Sequence
from typing import Protocol

from app.features.revenue.breakdown import build_breakdown, sort_rows
from app.features.revenue.decomposition import SegmentTotals, decompose
from app.features.revenue.exceptions import InvalidPeriodError, RevenueDataNotFoundError
from app.features.revenue.kpis import PeriodTotals, build_kpis
from app.features.revenue.schemas import (
    BreakdownQuery,
    BreakdownRowDTO,
    PeriodWindow,
    PriceVolumeDecompositionDTO,
    RevenueFilters,
    RevenueKpisDTO,
)
from app.shared.pagination import PaginatedResponse


class SegmentTotalsReader(Protocol):
    """Contrato do repositório: totais de volume e receita por segmento nas duas janelas."""

    async def fetch_segment_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> Sequence[SegmentTotals]:
        """Lê os totais por classe, município e bairro da janela base e da janela atual."""
        ...


class PeriodTotalsReader(Protocol):
    """Contrato do repositório: totais de receita, volume, faturas e UCs ativas nas duas janelas."""

    async def fetch_period_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> PeriodTotals:
        """Lê os totais gerais da janela base e da janela atual."""
        ...


class RevenueReader(SegmentTotalsReader, PeriodTotalsReader, Protocol):
    """Tudo o que o service precisa ler do repositório."""


class RevenueService:
    """Orquestra a decomposição Preço-Volume-Mix da receita."""

    def __init__(self, repository: RevenueReader) -> None:
        self.repository = repository

    @staticmethod
    def check_windows(base: PeriodWindow, current: PeriodWindow) -> None:
        """Garante que a janela base termina antes do início da janela atual."""
        if base.competencia_fim >= current.competencia_inicio:
            raise InvalidPeriodError(base, current)

    async def get_decomposition(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> PriceVolumeDecompositionDTO:
        """Decompõe a variação de receita entre duas janelas.

        Args:
            base: Janela de referência (por exemplo, o primeiro ano da base).
            current: Janela comparada (por exemplo, os últimos 12 meses).
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Efeitos de preço, volume, mix e cruzado, com o detalhe por segmento.

        Raises:
            InvalidPeriodError: Se a janela base não termina antes do início da janela atual.
            RevenueDataNotFoundError: Se não há faturamento para as janelas e filtros.
        """
        self.check_windows(base, current)
        segments = await self.repository.fetch_segment_totals(base, current, filters)
        if not segments:
            raise RevenueDataNotFoundError(base, current)
        return decompose(segments)

    async def get_kpis(self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters) -> RevenueKpisDTO:
        """Calcula os indicadores executivos de receita nas duas janelas.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Faturamento, volume, tarifa média, ticket médio e UCs ativas, com a variação percentual.

        Raises:
            InvalidPeriodError: Se a janela base não termina antes do início da janela atual.
            RevenueDataNotFoundError: Se não há faturamento em nenhuma das janelas.
        """
        self.check_windows(base, current)
        totals = await self.repository.fetch_period_totals(base, current, filters)
        if totals.base.faturas == 0 and totals.current.faturas == 0:
            raise RevenueDataNotFoundError(base, current)
        return build_kpis(totals)

    async def get_breakdown(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters, query: BreakdownQuery
    ) -> PaginatedResponse[BreakdownRowDTO]:
        """Monta o ranking paginado da variação de receita por município, bairro ou classe.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.
            query: Nível do detalhamento, ordenação e paginação.

        Returns:
            Uma página do ranking; a ordem padrão coloca a maior perda por efeito-volume primeiro.

        Raises:
            InvalidPeriodError: Se a janela base não termina antes do início da janela atual.
            RevenueDataNotFoundError: Se não há faturamento para as janelas e filtros.
        """
        self.check_windows(base, current)
        segments = await self.repository.fetch_segment_totals(base, current, filters)
        if not segments:
            raise RevenueDataNotFoundError(base, current)
        rows = sort_rows(build_breakdown(segments, query.nivel), query.ordenar_por, query.ordem)
        page_items = rows[query.offset : query.offset + query.page_size]
        return PaginatedResponse.create(page_items, len(rows), query)