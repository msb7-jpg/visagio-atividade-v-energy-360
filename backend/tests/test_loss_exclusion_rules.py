"""Motivo pelo qual uma UC avaliada ficou fora da fila e quando volta a ser avaliada (referência 2026-01)."""

from datetime import date

from app.features.loss_management.excluded_schemas import ExclusionReason
from app.features.loss_management.exclusion_rules import InspectionEvent, classify_exclusion
from app.features.loss_management.queries import build_windows

WINDOWS = build_windows("2026-01")  # análise desde 2024-11-01; prazo de reincidência desde 2025-02-01


def test_gd_unit_is_excluded_without_return_date():
    exclusion = classify_exclusion(has_gd=True, inspections=[], cancellation_dates=[], windows=WINDOWS)

    assert exclusion is not None
    assert exclusion.reason == ExclusionReason.POSSUI_GD
    assert exclusion.returns_on is None


def test_clean_inspection_keeps_unit_out_for_fifteen_months():
    events = [InspectionEvent(date(2025, 8, 10), irregular=False)]

    exclusion = classify_exclusion(has_gd=False, inspections=events, cancellation_dates=[], windows=WINDOWS)

    assert exclusion.reason == ExclusionReason.INSPECIONADA_SEM_ACHADO
    assert exclusion.event_date == date(2025, 8, 10)
    assert exclusion.returns_on == date(2026, 11, 1)  # 2025-08 + 15 meses


def test_irregular_inspection_keeps_unit_out_for_twelve_months():
    events = [InspectionEvent(date(2025, 8, 10), irregular=True)]

    exclusion = classify_exclusion(has_gd=False, inspections=events, cancellation_dates=[], windows=WINDOWS)

    assert exclusion.reason == ExclusionReason.IRREGULARIDADE_RECENTE
    assert exclusion.returns_on == date(2026, 8, 1)  # 2025-08 + 12 meses


def test_irregular_inspection_past_the_term_does_not_exclude():
    events = [InspectionEvent(date(2025, 1, 10), irregular=True)]

    assert classify_exclusion(has_gd=False, inspections=events, cancellation_dates=[], windows=WINDOWS) is None


def test_blocking_cancellation_returns_after_ninety_days():
    exclusion = classify_exclusion(
        has_gd=False, inspections=[], cancellation_dates=[date(2026, 1, 10)], windows=WINDOWS
    )

    assert exclusion.reason == ExclusionReason.CANCELAMENTO_BLOQUEANTE
    assert exclusion.returns_on == date(2026, 4, 10)


def test_latest_return_date_wins_when_several_rules_apply():
    events = [InspectionEvent(date(2025, 3, 5), irregular=False), InspectionEvent(date(2025, 12, 5), irregular=True)]

    exclusion = classify_exclusion(has_gd=False, inspections=events, cancellation_dates=[], windows=WINDOWS)

    assert exclusion.reason == ExclusionReason.IRREGULARIDADE_RECENTE  # volta em 2026-12, depois de 2026-06
    assert exclusion.returns_on == date(2026, 12, 1)
