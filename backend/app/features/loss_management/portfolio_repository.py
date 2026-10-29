"""Mediana da razão recente/base de toda a carteira, com cache por dia e por banco."""

import statistics

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.queries import build_windows, consumption_subquery

NEUTRAL_PORTFOLIO_RATIO = 1.0  # sem UC com consumo na janela, não há queda geral a descontar

# A carteira só muda quando o pipeline recarrega o Gold, então vale o dia inteiro, por competência de referência.
_portfolio_cache = DailyEngineCache[float]()


class PortfolioRepositoryMixin:
    """Queda geral da carteira, que a chance de acerto de cada UC desconta."""

    session: AsyncSession

    async def fetch_portfolio_ratio(self, reference_competencia: str) -> float:
        """Calcula a razão mediana consumo recente / consumo base de todas as UCs com consumo na janela.

        Considera a carteira inteira (com GD, inspecionadas e fora dos filtros da tela), porque é a queda geral
        que o campo enfrentou. O resultado fica em cache até o fim do dia por competência de referência.

        Args:
            reference_competencia: Competência em que as janelas de análise terminam ('YYYY-MM').

        Returns:
            A mediana de recente/base (1.0 se nenhuma UC tem consumo base na janela).
        """
        return await _portfolio_cache.get_or_compute(
            self.session.get_bind(), reference_competencia, lambda: self._query_portfolio_ratio(reference_competencia)
        )

    async def _query_portfolio_ratio(self, reference_competencia: str) -> float:
        consumo = consumption_subquery(build_windows(reference_competencia))
        ratio = consumo.c.consumo_recente_kwh / consumo.c.consumo_base_kwh
        query = select(ratio).where(consumo.c.consumo_base_kwh > 0, consumo.c.consumo_recente_kwh.is_not(None))
        ratios = list((await self.session.scalars(query)).all())
        return statistics.median(ratios) if ratios else NEUTRAL_PORTFOLIO_RATIO
