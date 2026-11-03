"""Cache das linhas da fila por banco: a lista, o resumo e os filtros da tela reaproveitam o mesmo cálculo."""

from collections.abc import Callable, Hashable, Mapping
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.models import InspectionOrder

QueueRows = list[Any]

_queue_rows_cache = DailyEngineCache[QueueRows]()


def orders_version_query() -> Select:
    """Quantas ordens existem e quando a última mudou: muda a cada ordem criada, alterada, concluída ou cancelada."""
    return select(func.count(InspectionOrder.id_inspecao), func.max(InspectionOrder.atualizado_em))


async def cached_queue_rows(
    session: AsyncSession, key: Hashable, query: Select, build: Callable[[Mapping[str, Any]], Any]
) -> QueueRows:
    """Devolve as linhas da fila calculadas uma vez por dia, por critérios e por versão das ordens do portal.

    A abertura da Fila pede a mesma fila sem filtro três vezes (lista, resumo da seleção e contagem dos filtros).
    Com o cache, a consulta pesada roda uma vez e as outras chamadas recebem a mesma lista (o mesmo objeto), o que
    também deixa a ordenação da fila ser reaproveitada (`scoring.rank_suspicious_units`). Qualquer mudança
    em `ordem_inspecao` muda a versão e refaz o cálculo, porque ordens concluídas e canceladas tiram UCs da fila.

    Args:
        session: Sessão do banco da fila.
        key: Critérios da consulta (filtros, competência de referência e janelas).
        query: Consulta da fila, executada só quando não há valor válido.
        build: Converte cada linha no item guardado (por exemplo, `ConsumptionProfile`).

    Returns:
        As linhas da fila para esses critérios.
    """

    async def run_query() -> QueueRows:
        return [build(row) for row in (await session.execute(query)).mappings()]

    order_count, last_change = (await session.execute(orders_version_query())).one()
    return await _queue_rows_cache.get_or_compute(session.get_bind(), (key, order_count, last_change), run_query)
