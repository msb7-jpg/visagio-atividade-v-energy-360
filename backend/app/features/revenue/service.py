from collections.abc import Sequence
from typing import Protocol
 
from app.features.revenue.decomposition import SegmentTotals, decompose
from app.features.revenue.exceptions import InvalidPeriodError, RevenueDataNotFoundError
from app.features.revenue.schemas import PeriodWindow, PriceVolumeDecompositionDTO, RevenueFilters
 
 
class SegmentTotalsReader(Protocol):
    """Contrato do repositório: totais de volume e receita por segmento nas duas janelas."""
 
    async def fetch_segment_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> Sequence[SegmentTotals]:
        """Lê os totais por classe, município e bairro da janela base e da janela atual."""
        ...
 
 
class RevenueService:
    """Orquestra a decomposição Preço-Volume-Mix da receita."""
 
    def __init__(self, repository: SegmentTotalsReader) -> None:
        self.repository = repository
 
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
        if base.competencia_fim >= current.competencia_inicio:
            raise InvalidPeriodError(base, current)
        segments = await self.repository.fetch_segment_totals(base, current, filters)
        if not segments:
            raise RevenueDataNotFoundError(base, current)
        return decompose(segments)