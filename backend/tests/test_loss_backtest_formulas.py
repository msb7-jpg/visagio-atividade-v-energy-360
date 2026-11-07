"""Fórmulas do backtest: precisão da seleção, linha de base da operação e amostra mínima por motivo."""

from datetime import date

import pytest

from app.features.loss_management.backtest_formulas import (
    MIN_SAMPLE_PER_REASON,
    FieldInspection,
    evaluate_selection,
    outcome_window,
)
from app.features.loss_management.schemas import SuspicionReason

DAY = date(2025, 8, 10)


def _inspection(id_uc: str, *, irregular: bool, kwh: float | None = None) -> FieldInspection:
    return FieldInspection(id_uc=id_uc, inspected_on=DAY, irregular=irregular, kwh_recovered=kwh)


def test_outcome_window_starts_after_the_cutoff_month_and_spans_three_months():
    start, end = outcome_window("2025-07")

    assert start == date(2025, 8, 1)
    assert end == date(2025, 10, 31)


def test_outcome_window_crosses_the_year_boundary():
    start, end = outcome_window("2025-11")

    assert (start, end) == (date(2025, 12, 1), date(2026, 2, 28))


def test_precision_counts_only_selected_units_that_were_inspected():
    subita = SuspicionReason.QUEDA_SUBITA
    selection = {"A": subita, "B": subita, "C": subita}
    inspections = [
        _inspection("A", irregular=True, kwh=100.0),
        _inspection("B", irregular=False),
        _inspection("Z", irregular=False),  # fora da seleção: só entra na linha de base
    ]

    result = evaluate_selection(selection, inspections)

    assert result.selected_total == 3
    assert result.selected_inspected == 2
    assert result.selected_irregular == 1
    assert result.precision == pytest.approx(0.5)
    assert result.kwh_recovered == pytest.approx(100.0)


def test_baseline_is_the_hit_rate_of_every_inspection_in_the_window():
    selection = {"A": SuspicionReason.QUEDA_SUBITA}
    inspections = [
        _inspection("A", irregular=True),
        _inspection("Z", irregular=False),
        _inspection("Y", irregular=False),
    ]

    result = evaluate_selection(selection, inspections)

    assert result.window_inspections == 3
    assert result.baseline == pytest.approx(1 / 3)
    assert result.difference_pp == pytest.approx((1.0 - 1 / 3) * 100)


def test_without_inspections_of_the_selection_precision_is_unknown_not_zero():
    result = evaluate_selection({"A": SuspicionReason.QUEDA_SUBITA}, [_inspection("Z", irregular=True)])

    assert result.precision is None
    assert result.difference_pp is None


def test_without_any_inspection_baseline_is_unknown():
    result = evaluate_selection({"A": SuspicionReason.QUEDA_SUBITA}, [])

    assert result.baseline is None


def test_reason_with_small_sample_is_flagged_as_insufficient():
    selection = {f"U{index}": SuspicionReason.QUEDA_MODERADA for index in range(MIN_SAMPLE_PER_REASON)}
    selection["S"] = SuspicionReason.QUEDA_SUBITA
    inspections = [_inspection(id_uc, irregular=True) for id_uc in selection]

    result = evaluate_selection(selection, inspections)

    by_reason = {entry.reason: entry for entry in result.by_reason}
    assert by_reason[SuspicionReason.QUEDA_MODERADA].sufficient_sample is True
    assert by_reason[SuspicionReason.QUEDA_SUBITA].sufficient_sample is False
    assert by_reason[SuspicionReason.QUEDA_SUBITA].inspected == 1


def test_missing_recovered_energy_counts_as_zero():
    result = evaluate_selection(
        {"A": SuspicionReason.QUEDA_SUBITA}, [_inspection("A", irregular=True, kwh=None)]
    )

    assert result.kwh_recovered == pytest.approx(0.0)
