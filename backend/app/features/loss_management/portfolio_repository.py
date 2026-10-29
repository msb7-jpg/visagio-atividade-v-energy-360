"""Mediana da razão recente/base de toda a carteira, com cache por dia e por banco."""

import statistics
from datetime import date
from weakref import WeakKeyDictionary

from sqlalchemy import Engine, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.queries import build_windows, consumption_subquery

NEUTRAL_PORTFOLIO_RATIO = 1.0  # sem UC com consumo na janela, não há queda geral a descontar

# Uma entrada por banco: a carteira só muda quando o pipeline recarrega o Gold, então vale o dia inteiro.
_portfolio_cache: WeakKeyDictionary[Engine, tuple[date, str, float]] = WeakKeyDictionary()


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
        engine = self.session.get_bind()
        today = date.today()
        cached = _portfolio_cache.get(engine)
        if cached is not None and cached[:2] == (today, reference_competencia):
            return cached[2]
        consumo = consumption_subquery(build_windows(reference_competencia))
        ratio = consumo.c.consumo_recente_kwh / consumo.c.consumo_base_kwh
        query = select(ratio).where(consumo.c.consumo_base_kwh > 0, consumo.c.consumo_recente_kwh.is_not(None))
        ratios = list((await self.session.scalars(query)).all())
        median_ratio = statistics.median(ratios) if ratios else NEUTRAL_PORTFOLIO_RATIO
        _portfolio_cache[engine] = (today, reference_competencia, median_ratio)
        return median_ratio
