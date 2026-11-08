"""Pares: mediana de recente/base por classe de consumo, a referência que separa sazonalidade de queda anormal."""

import statistics
from collections import defaultdict
from collections.abc import Callable, Mapping, Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.queries import build_windows, consumption_subquery, dim_unidade_consumidora
from app.features.loss_management.scoring import ConsumptionProfile

# Com menos UCs a mediana da classe é instável: a classe usa a mediana da carteira inteira.
MIN_PEER_UNITS = 100

PeerRatios = dict[str | None, float]

# Como a carteira, os pares só mudam quando o pipeline recarrega o Gold: valem o dia, por competência de referência.
_peer_cache = DailyEngineCache[PeerRatios]()


def median_ratio_by_class(
    ratios_by_class: Mapping[str | None, Sequence[float]], fallback: float, min_units: int
) -> PeerRatios:
    """Calcula a mediana de recente/base de cada classe de consumo.

    Args:
        ratios_by_class: Razão recente/base de cada UC, agrupada pela classe.
        fallback: Mediana da carteira inteira, usada pela classe com menos de `min_units` UCs.
        min_units: Mínimo de UCs para a classe ter mediana própria.

    Returns:
        A mediana de cada classe (ou o `fallback` quando a classe é pequena demais).
    """
    return {
        classe: statistics.median(ratios) if len(ratios) >= min_units else fallback
        for classe, ratios in ratios_by_class.items()
    }


def profile_builder(peer_ratios: PeerRatios | None, portfolio_ratio: float) -> Callable[[Mapping[str, Any]], Any]:
    """Cria o conversor de linha da fila em perfil, com a razão dos pares da classe da UC.

    Args:
        peer_ratios: Mediana por classe; None mantém o modelo atual (sem `peer_ratio` no perfil).
        portfolio_ratio: Mediana da carteira, usada pela classe que não aparece em `peer_ratios`.

    Returns:
        Função que converte uma linha da consulta da fila em `ConsumptionProfile`.
    """
    if peer_ratios is None:
        return lambda row: ConsumptionProfile(**row)
    return lambda row: ConsumptionProfile(**row, peer_ratio=peer_ratios.get(row["classe_consumo"], portfolio_ratio))


async def fetch_peer_ratios(session: AsyncSession, reference_competencia: str, portfolio_ratio: float) -> PeerRatios:
    """Calcula a razão mediana recente/base de cada classe, com a carteira como reserva das classes pequenas.

    Args:
        session: Sessão do banco Gold.
        reference_competencia: Competência em que as janelas de análise terminam ('YYYY-MM').
        portfolio_ratio: Mediana da carteira inteira, usada pela classe com poucas UCs.

    Returns:
        A mediana de cada classe de consumo; fica em cache até o fim do dia.
    """

    async def compute() -> PeerRatios:
        return await _query_peer_ratios(session, reference_competencia, portfolio_ratio)

    return await _peer_cache.get_or_compute(session.get_bind(), reference_competencia, compute)


async def _query_peer_ratios(session: AsyncSession, reference_competencia: str, portfolio_ratio: float) -> PeerRatios:
    consumo = consumption_subquery(build_windows(reference_competencia))
    ratio = consumo.c.consumo_recente_kwh / consumo.c.consumo_base_kwh
    query = (
        select(dim_unidade_consumidora.c.classe_consumo, ratio)
        .select_from(consumo.join(dim_unidade_consumidora, consumo.c.id_uc == dim_unidade_consumidora.c.id_uc))
        .where(
            consumo.c.consumo_base_kwh > 0,
            consumo.c.consumo_recente_kwh.is_not(None),
            dim_unidade_consumidora.c.classe_consumo.is_not(None),  # sem classe, a UC usa a carteira
        )
    )
    ratios_by_class: dict[str | None, list[float]] = defaultdict(list)
    for classe, unit_ratio in (await session.execute(query)).all():
        ratios_by_class[classe].append(unit_ratio)
    return median_ratio_by_class(ratios_by_class, portfolio_ratio, MIN_PEER_UNITS)
