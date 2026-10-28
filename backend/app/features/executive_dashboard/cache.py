"""Cache em memória das respostas do Painel: as tabelas Gold só mudam quando o pipeline exporta um banco novo."""

import time
from collections.abc import Callable, Hashable
from dataclasses import dataclass, field

from app.features.executive_dashboard.schemas import DashboardIndicatorsDTO, LossesSnapshotDTO

VALIDADE_CACHE_SEGUNDOS = 30 * 60


class ResultCache[Key: Hashable, Value]:
    """Guarda cada resultado por um tempo fixo; depois disso a próxima leitura recalcula."""

    def __init__(self, ttl_seconds: float, clock: Callable[[], float] = time.monotonic) -> None:
        self.ttl_seconds = ttl_seconds
        self.clock = clock
        self._entries: dict[Key, tuple[float, Value]] = {}

    def get(self, key: Key) -> Value | None:
        """Devolve o resultado guardado, ou None se não existe ou venceu."""
        entry = self._entries.get(key)
        if entry is None or entry[0] <= self.clock():
            return None
        return entry[1]

    def put(self, key: Key, value: Value) -> None:
        """Guarda o resultado até `ttl_seconds` a partir de agora."""
        self._entries[key] = (self.clock() + self.ttl_seconds, value)

    def clear(self) -> None:
        """Descarta todos os resultados guardados."""
        self._entries.clear()


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
