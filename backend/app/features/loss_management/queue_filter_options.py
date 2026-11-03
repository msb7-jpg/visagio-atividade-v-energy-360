"""Opções dos filtros da Fila de Inspeção com a contagem de UCs reais que cada opção devolve."""

from collections import Counter

from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.queue_summary import apply_situation
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    QueueFilterCountsDTO,
    QueueFiltersDTO,
    QueueSituation,
    SuspicionReason,
    SuspiciousUnitDTO,
)
from app.features.loss_management.scoring import LIMIAR_QUEDA_MODERADA, rank_suspicious_units


def count_queue_options(units: list[SuspiciousUnitDTO], options: QueueFiltersDTO) -> QueueFilterCountsDTO:
    """Conta as UCs da fila em cada opção de município, classe, motivo e situação.

    Toda opção listada aparece, com 0 quando nenhuma UC da fila tem aquele valor. Uma UC com dois motivos conta
    uma vez em cada motivo, mas uma só vez no seu município e na sua classe.

    Args:
        units: UCs da fila inteira, sem filtro e já com a situação marcada.
        options: Municípios e classes do cadastro, que definem quais opções aparecem.

    Returns:
        Contagens por município, classe, motivo e situação.
    """
    by_municipality = Counter(unit.municipio for unit in units)
    by_class = Counter(unit.classe_consumo for unit in units)
    by_reason = Counter(reason for unit in units for reason in unit.motivos)
    by_situation = Counter(unit.situacao for unit in units)
    return QueueFilterCountsDTO(
        municipios={municipality: by_municipality[municipality] for municipality in options.municipios},
        classes={consumption_class: by_class[consumption_class] for consumption_class in options.classes},
        motivos={reason.value: by_reason[reason] for reason in SuspicionReason},
        situacoes={situation.value: by_situation[situation] for situation in QueueSituation},
    )


async def build_queue_filter_options(repository: LossRepository) -> QueueFiltersDTO:
    """Monta as opções dos filtros do cadastro e conta quantas UCs da fila cada uma devolve.

    A contagem é feita sobre a fila inteira, a mesma que a lista ordena, e por isso bate com o `total` da lista
    quando aquela opção é escolhida sozinha.

    Args:
        repository: Repositório da fila, com o cadastro de UCs e as medições.

    Returns:
        Municípios, classes e a contagem de UCs de cada opção.

    Raises:
        DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
    """
    options = await repository.fetch_filter_options()
    candidates = await repository.fetch_consumption_profiles(SuspicionFilters(limiar_queda=LIMIAR_QUEDA_MODERADA))
    tariff = await repository.fetch_average_tariff()
    ranked_units = rank_suspicious_units(
        candidates.profiles, limit=None, tariff_rs_kwh=tariff.rs_per_kwh, portfolio_ratio=candidates.portfolio_ratio
    )
    queue = apply_situation(ranked_units, candidates.active_orders)
    return options.model_copy(update={"contagens": count_queue_options(queue, options)})
