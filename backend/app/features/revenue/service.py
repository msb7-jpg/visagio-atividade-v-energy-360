from collections.abc import Sequence
from typing import Protocol

from app.features.revenue.breakdown import build_breakdown, sort_rows
from app.features.revenue.decomposition import SegmentTotals, decompose
from app.features.revenue.exceptions import (
    InvalidPeriodError,
    NeighborhoodHistoryNotFoundError,
    RevenueDataNotFoundError,
)
from app.features.revenue.history import MonthlyTotals, build_history, competencias_until
from app.features.revenue.kpis import PeriodTotals, build_kpis
from app.features.revenue.schemas import (
    BreakdownQuery,
    BreakdownRowDTO,
    NeighborhoodHistoryDTO,
    NeighborhoodHistoryRequest,
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


class MonthlyTotalsReader(Protocol):
    """Contrato do repositório: volume e receita por competência."""

    async def fetch_monthly_totals(self, window: PeriodWindow, filters: RevenueFilters) -> Sequence[MonthlyTotals]:
        """Lê os totais mensais da janela, para os filtros dados."""
        ...


class RevenueReader(SegmentTotalsReader, PeriodTotalsReader, MonthlyTotalsReader, Protocol):
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

    async def get_neighborhood_history(self, request: NeighborhoodHistoryRequest) -> NeighborhoodHistoryDTO:
        """Monta a série mensal de volume, receita e tarifa média de um bairro.

        Args:
            request: Bairro, última competência e quantidade de meses.

        Returns:
            Série contínua; os meses sem faturamento aparecem com volume e receita zero.

        Raises:
            NeighborhoodHistoryNotFoundError: Se o bairro não tem faturamento em nenhum mês da janela.
        """
        competencias = competencias_until(request.competencia_fim, request.meses)
        window = PeriodWindow(competencia_inicio=competencias[0], competencia_fim=competencias[-1])
        filters = RevenueFilters(
            municipio=request.municipio, bairro=request.bairro, classe_consumo=request.classe_consumo
        )
        totals = await self.repository.fetch_monthly_totals(window, filters)
        if not totals:
            raise NeighborhoodHistoryNotFoundError(request)
        return build_history(request, totals)