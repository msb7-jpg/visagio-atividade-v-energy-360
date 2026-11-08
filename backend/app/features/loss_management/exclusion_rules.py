"""Regras puras de exclusão da fila: por que uma UC com queda de consumo está fora e quando volta a ser avaliada.

Espelham as janelas de `queue_query.py`: inspeção sem achado vale pela janela de análise (15 meses), irregularidade
constatada pelo prazo de reincidência (12 meses) e cancelamento bloqueante por `CANCELLATION_BLOCK_DAYS`.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from app.features.loss_management.excluded_schemas import ExclusionReason
from app.features.loss_management.queries import (
    MESES_JANELA_BASE,
    MESES_JANELA_RECENTE,
    MESES_PRAZO_REINCIDENCIA,
    ConsumptionWindows,
    competencia_first_day,
    inspection_cutoff_date,
    reincidence_cutoff_date,
    shift_competencia,
)
from app.features.loss_management.queue_query import CANCELLATION_BLOCK_DAYS

MESES_JANELA_ANALISE = MESES_JANELA_BASE + MESES_JANELA_RECENTE


@dataclass(frozen=True, slots=True)
class InspectionEvent:
    """Inspeção da UC (histórico de campo ou ordem concluída) e se constatou irregularidade."""

    event_date: date
    irregular: bool


@dataclass(frozen=True, slots=True)
class Exclusion:
    """Motivo da exclusão, a data do evento que a causou e quando a UC volta a ser avaliada."""

    reason: ExclusionReason
    event_date: date | None
    returns_on: date | None


def _returns_after_months(event_date: date, months: int) -> date:
    competencia = f"{event_date.year:04d}-{event_date.month:02d}"
    return competencia_first_day(shift_competencia(competencia, months))


def _inspection_exclusions(inspections: list[InspectionEvent], windows: ConsumptionWindows) -> list[Exclusion]:
    irregular_since = reincidence_cutoff_date(windows)
    clean_since = inspection_cutoff_date(windows)
    exclusions = []
    for inspection in inspections:
        if inspection.irregular and inspection.event_date >= irregular_since:
            returns_on = _returns_after_months(inspection.event_date, MESES_PRAZO_REINCIDENCIA)
            exclusions.append(Exclusion(ExclusionReason.IRREGULARIDADE_RECENTE, inspection.event_date, returns_on))
        elif not inspection.irregular and inspection.event_date >= clean_since:
            returns_on = _returns_after_months(inspection.event_date, MESES_JANELA_ANALISE)
            exclusions.append(Exclusion(ExclusionReason.INSPECIONADA_SEM_ACHADO, inspection.event_date, returns_on))
    return exclusions


def classify_exclusion(
    *,
    has_gd: bool,
    inspections: list[InspectionEvent],
    cancellation_dates: list[date],
    windows: ConsumptionWindows,
) -> Exclusion | None:
    """Diz por que a UC está fora da fila; havendo vários motivos, vale o que a mantém fora por mais tempo.

    Args:
        has_gd: A UC tem geração distribuída (excluída sem prazo de volta).
        inspections: Inspeções da UC (histórico de campo e ordens concluídas).
        cancellation_dates: Datas de cancelamentos por cliente regularizado ou endereço não localizado.
        windows: Janelas de análise da fila, ancoradas na competência de referência.

    Returns:
        A exclusão aplicável, ou None se nenhuma regra mantém a UC fora da fila.
    """
    if has_gd:
        return Exclusion(ExclusionReason.POSSUI_GD, None, None)
    exclusions = _inspection_exclusions(inspections, windows)
    block = timedelta(days=CANCELLATION_BLOCK_DAYS)
    exclusions.extend(
        Exclusion(ExclusionReason.CANCELAMENTO_BLOQUEANTE, cancelled_on, cancelled_on + block)
        for cancelled_on in cancellation_dates
    )
    return max(exclusions, key=lambda exclusion: exclusion.returns_on or date.min, default=None)
