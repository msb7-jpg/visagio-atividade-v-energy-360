"""Curva de retorno acumulado da fila e corte sugerido pelo custo da inspeção."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.features.loss_management.queue_curve import build_return_curve
from app.features.loss_management.queue_curve_service import QueueCurveService
from app.features.loss_management.schemas import InspectionStatus, QueueSituation, SuspiciousUnitDTO
from app.features.loss_management.scoring import ConsumptionProfile, QueueCandidates

TARIFF_RS_KWH = 0.7


def make_unit(id_uc: str, monthly_kwh: float, chance: float) -> SuspiciousUnitDTO:
    return SuspiciousUnitDTO(
        id_uc=id_uc,
        municipio="RECIFE",
        bairro="BOA VIAGEM",
        classe_consumo="RESIDENCIAL",
        motivos=[],
        score_risco=0.0,
        probabilidade_acerto=chance,
        consumo_base_kwh=100.0,
        consumo_recente_kwh=100.0 - monthly_kwh,
        kwh_estimado_recuperar=monthly_kwh * 3,
        valor_estimado_recuperar_rs=0.0,
        kwh_mes_recuperavel=monthly_kwh,
        valor_ano_rs=round(monthly_kwh * 12 * TARIFF_RS_KWH, 2),
        situacao=QueueSituation.NA_FILA,
    )


def ranked_units(count: int) -> list[SuspiciousUnitDTO]:
    """UCs em ordem decrescente de retorno esperado: 100, 90, ... kWh/mês com 90% de chance."""
    return [make_unit(f"UC{position}", 100.0 - 10.0 * position, 0.9) for position in range(count)]


def test_the_curve_accumulates_the_expected_return_by_position():
    curve = build_return_curve(ranked_units(3), cost_rs=None, max_points=10)

    assert [point.posicao for point in curve.pontos] == [1, 2, 3]
    assert curve.pontos[0].kwh_mes_acumulado == pytest.approx(90.0)  # 100 kWh x 90%
    assert curve.pontos[2].kwh_mes_acumulado == pytest.approx(90.0 + 81.0 + 72.0)
    assert curve.pontos[0].valor_ano_acumulado_rs == pytest.approx(100.0 * 12 * TARIFF_RS_KWH * 0.9)
    assert curve.total_ucs == 3


def test_the_curve_keeps_at_most_the_requested_points_and_always_the_last_position():
    curve = build_return_curve(ranked_units(95), cost_rs=None, max_points=10)

    positions = [point.posicao for point in curve.pontos]

    assert len(positions) <= 10
    assert positions[-1] == 95
    assert positions == sorted(set(positions))


def test_an_empty_queue_gives_an_empty_curve_without_a_cut():
    curve = build_return_curve([], cost_rs=500.0, max_points=10)

    assert curve.pontos == []
    assert curve.total_ucs == 0
    assert curve.corte_sugerido == 0


def test_without_a_cost_there_is_no_suggested_cut():
    assert build_return_curve(ranked_units(3), cost_rs=None, max_points=10).corte_sugerido is None


def test_the_suggested_cut_stops_where_the_next_visit_returns_less_than_it_costs():
    units = ranked_units(5)  # retorno esperado em R$/ano: 756, 680.4, 604.8, 529.2, 453.6

    curve = build_return_curve(units, cost_rs=600.0, max_points=10)

    assert curve.corte_sugerido == 3
    assert curve.custo_inspecao_rs == pytest.approx(600.0)


def test_a_cost_above_every_return_suggests_no_visit_and_a_zero_cost_suggests_all():
    assert build_return_curve(ranked_units(3), cost_rs=1_000_000.0, max_points=10).corte_sugerido == 0
    assert build_return_curve(ranked_units(3), cost_rs=0.0, max_points=10).corte_sugerido == 3


async def test_the_service_builds_the_curve_only_from_the_units_free_for_inspection():
    def profile(id_uc: str, recent_kwh: float) -> ConsumptionProfile:
        return ConsumptionProfile(
            id_uc=id_uc,
            municipio="RECIFE",
            bairro="BOA VIAGEM",
            classe_consumo="RESIDENCIAL",
            consumo_base_kwh=100.0,
            consumo_recente_kwh=recent_kwh,
            meses_zerados=0,
        )

    candidates = QueueCandidates(
        profiles=[profile("UC_A", 40.0), profile("UC_B", 50.0), profile("UC_C", 60.0)],
        field_history_applied=True,
        active_orders={"UC_A": InspectionStatus.GERADA},
    )

    repository = SimpleNamespace(
        fetch_consumption_profiles=AsyncMock(return_value=candidates),
        fetch_average_tariff=AsyncMock(return_value=SimpleNamespace(rs_per_kwh=TARIFF_RS_KWH)),
    )

    curve = await QueueCurveService(repository).build_curve(cost_rs=None, max_points=10)

    assert curve.total_ucs == 2  # UC_A já tem ordem ativa
    assert curve.pontos[0].kwh_mes_acumulado == pytest.approx(50.0 * 0.93)
    assert curve.pontos[1].kwh_mes_acumulado == pytest.approx(50.0 * 0.93 + 40.0 * 0.915)
    assert curve.tarifa_rs_kwh == pytest.approx(TARIFF_RS_KWH)
