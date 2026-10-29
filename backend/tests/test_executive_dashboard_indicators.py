import pytest

from app.features.executive_dashboard.catalog import GROUPS, build_groups
from app.features.executive_dashboard.indicators import (
    AreaTotals,
    IndicatorSpec,
    PeriodSnapshots,
    WindowSnapshot,
    build_indicator,
    contains_storm,
    evaluate,
    percent,
)
from app.features.executive_dashboard.schemas import IndicatorDirection, IndicatorEvaluation, IndicatorUnit
from app.features.revenue.kpis import WindowTotals
from app.features.revenue.schemas import PeriodWindow

BASE_WINDOW = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT_WINDOW = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")
EMPTY_AREAS = AreaTotals(0.0, 0.0, 0, 0.0, None, None, 0, 0, 0)


def snapshots(base_revenue: float, current_revenue: float, current_window: PeriodWindow = CURRENT_WINDOW):
    return PeriodSnapshots(
        base_window=BASE_WINDOW,
        current_window=current_window,
        base=WindowSnapshot(WindowTotals(base_revenue, 1000.0, 12, 1), EMPTY_AREAS),
        current=WindowSnapshot(WindowTotals(current_revenue, 1000.0, 12, 1), EMPTY_AREAS),
    )


def revenue_spec(direction: IndicatorDirection, *, storm: bool = False) -> IndicatorSpec:
    return IndicatorSpec(
        "receita", "Receita", IndicatorUnit.RS, direction, "Teste.",
        lambda snapshot: snapshot.revenue.receita_rs, afetado_pelo_temporal=storm,
    )


@pytest.mark.parametrize(
    ("direction", "change_pct", "expected"),
    [
        (IndicatorDirection.MAIOR_MELHOR, 8.0, IndicatorEvaluation.MELHOROU),
        (IndicatorDirection.MAIOR_MELHOR, -3.8, IndicatorEvaluation.PIOROU),
        (IndicatorDirection.MENOR_MELHOR, -3.8, IndicatorEvaluation.MELHOROU),
        (IndicatorDirection.MENOR_MELHOR, 8.0, IndicatorEvaluation.PIOROU),
        (IndicatorDirection.MENOR_MELHOR, 0.9, IndicatorEvaluation.ESTAVEL),
        (IndicatorDirection.MAIOR_MELHOR, -0.9, IndicatorEvaluation.ESTAVEL),
        (IndicatorDirection.MAIOR_MELHOR, 1.0, IndicatorEvaluation.MELHOROU),
        (IndicatorDirection.MAIOR_MELHOR, None, IndicatorEvaluation.SEM_COMPARACAO),
        (IndicatorDirection.NEUTRO, 25.0, IndicatorEvaluation.INFORMATIVO),
        (IndicatorDirection.NEUTRO, None, IndicatorEvaluation.INFORMATIVO),
    ],
)
def test_evaluate_uses_direction_and_one_percent_threshold(direction, change_pct, expected):
    assert evaluate(direction, change_pct) is expected


def test_percent_is_empty_when_whole_is_zero():
    assert percent(1.0, 4.0) == pytest.approx(25.0)
    assert percent(1.0, 0.0) is None


def test_build_indicator_rounds_by_unit_and_computes_variation():
    indicator = build_indicator(revenue_spec(IndicatorDirection.MAIOR_MELHOR), snapshots(100.004, 108.0))

    assert indicator.base == pytest.approx(100.0)
    assert indicator.atual == pytest.approx(108.0)
    assert indicator.variacao_pct == pytest.approx(8.0)
    assert indicator.avaliacao is IndicatorEvaluation.MELHOROU
    assert indicator.aviso is None


def test_build_indicator_without_base_has_no_comparison():
    indicator = build_indicator(revenue_spec(IndicatorDirection.MAIOR_MELHOR), snapshots(0.0, 50.0))

    assert indicator.variacao_pct is None
    assert indicator.avaliacao is IndicatorEvaluation.SEM_COMPARACAO


def test_storm_warning_depends_on_window_and_indicator():
    after_storm = PeriodWindow(competencia_inicio="2025-08", competencia_fim="2026-06")

    assert contains_storm(CURRENT_WINDOW)
    assert not contains_storm(after_storm)
    assert build_indicator(revenue_spec(IndicatorDirection.MENOR_MELHOR, storm=True), snapshots(1, 2)).aviso
    assert build_indicator(revenue_spec(IndicatorDirection.MENOR_MELHOR), snapshots(1, 2)).aviso is None
    assert build_indicator(
        revenue_spec(IndicatorDirection.MENOR_MELHOR, storm=True), snapshots(1, 2, after_storm)
    ).aviso is None


def test_catalog_has_unique_ids_and_tolerates_empty_areas():
    indicator_ids = [spec.id for group in GROUPS for spec in group.indicadores]
    groups = build_groups(snapshots(0.0, 0.0))

    assert len(indicator_ids) == len(set(indicator_ids)) == 11
    satisfaction = next(
        indicator for group in groups for indicator in group.indicadores if indicator.id == "satisfacao"
    )
    assert satisfaction.base is None
    assert satisfaction.avaliacao is IndicatorEvaluation.SEM_COMPARACAO


def rate_spec() -> IndicatorSpec:
    return IndicatorSpec(
        "inadimplencia", "Inadimplência", IndicatorUnit.PCT, IndicatorDirection.MENOR_MELHOR, "Teste.",
        lambda snapshot: snapshot.revenue.receita_rs,
    )


def test_rates_are_evaluated_in_percentage_points():
    tiny_change = build_indicator(rate_spec(), snapshots(3.55, 3.60))
    real_change = build_indicator(rate_spec(), snapshots(3.55, 3.95))

    assert tiny_change.variacao_pct == pytest.approx(1.4)
    assert tiny_change.variacao_pp == pytest.approx(0.05)
    assert tiny_change.avaliacao is IndicatorEvaluation.ESTAVEL
    assert real_change.variacao_pp == pytest.approx(0.4)
    assert real_change.avaliacao is IndicatorEvaluation.PIOROU


def test_only_rates_have_percentage_points():
    indicator = build_indicator(revenue_spec(IndicatorDirection.MAIOR_MELHOR), snapshots(100.0, 108.0))

    assert indicator.variacao_pp is None
