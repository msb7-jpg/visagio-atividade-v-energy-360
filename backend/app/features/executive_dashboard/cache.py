"""Cache em memória das respostas do Painel: as tabelas Gold só mudam quando o pipeline exporta um banco novo."""

from dataclasses import dataclass, field

from app.features.executive_dashboard.schemas import DashboardIndicatorsDTO, LossesSnapshotDTO
from app.shared.result_cache import ResultCache

VALIDADE_CACHE_SEGUNDOS = 30 * 60


@dataclass(slots=True)
class DashboardCache:
    """Caches dos indicadores (por par de janelas) e do retrato de perdas."""

    indicators: ResultCache[tuple, DashboardIndicatorsDTO] = field(
        default_factory=lambda: ResultCache(VALIDADE_CACHE_SEGUNDOS)
    )
    losses: ResultCache[str, LossesSnapshotDTO] = field(default_factory=lambda: ResultCache(VALIDADE_CACHE_SEGUNDOS))

    def clear(self) -> None:
        """Descarta tudo, por exemplo depois de carregar um banco Gold novo."""
        self.indicators.clear()
        self.losses.clear()


dashboard_cache = DashboardCache()
