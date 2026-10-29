"""Leitura da tarifa média em `fato_faturamento`, com cache por dia e por banco."""

import logging
from datetime import date
from weakref import WeakKeyDictionary

from sqlalchemy import Engine, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.queries import fato_faturamento, shift_competencia
from app.features.loss_management.queue_repository import GOLD_QUERY_ERRORS
from app.features.loss_management.tariff import EMPTY_BILLING_MESSAGE, AverageTariff, compute_average_tariff
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

MESES_TARIFA = 12
TARIFF_ERROR_MESSAGE = "Falha ao calcular a tarifa média em fato_faturamento."

# Uma entrada por banco: a tarifa só muda quando o pipeline recarrega o Gold, então vale o dia inteiro.
_tariff_cache: WeakKeyDictionary[Engine, tuple[date, AverageTariff]] = WeakKeyDictionary()


class TariffRepositoryMixin:
    """Tarifa média dos últimos 12 meses faturados, usada em todo valor em R$ da Fila."""

    session: AsyncSession

    async def fetch_average_tariff(self) -> AverageTariff:
        """Devolve a tarifa média (receita ÷ energia faturada) dos 12 meses até a última competência faturada.

        O resultado fica em cache até o fim do dia, para não varrer `fato_faturamento` a cada requisição.
        Falhas e tabela vazia nunca entram no cache nem viram uma tarifa de reserva.

        Returns:
            A tarifa em R$/kWh e o período usado.

        Raises:
            DatabaseReadError: Se `fato_faturamento` está ausente, fora do contrato ou sem energia faturada.
        """
        engine = self.session.get_bind()
        today = date.today()
        cached = _tariff_cache.get(engine)
        if cached is not None and cached[0] == today:
            return cached[1]
        tariff = await self._query_average_tariff()
        _tariff_cache[engine] = (today, tariff)
        return tariff

    async def _query_average_tariff(self) -> AverageTariff:
        competencia = fato_faturamento.c.competencia
        try:
            period_end = await self.session.scalar(select(func.max(competencia)))
            if period_end is None:
                raise DatabaseReadError(EMPTY_BILLING_MESSAGE)
            period_start = shift_competencia(period_end, 1 - MESES_TARIFA)
            totals = select(
                func.sum(fato_faturamento.c.valor_total_rs), func.sum(fato_faturamento.c.consumo_faturado_kwh)
            ).where(competencia.between(period_start, period_end))
            revenue_rs, energy_kwh = (await self.session.execute(totals)).one()
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar fato_faturamento para a tarifa média.")
            raise DatabaseReadError(TARIFF_ERROR_MESSAGE) from e
        return compute_average_tariff(revenue_rs, energy_kwh, period_start, period_end)
