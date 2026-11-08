"""Backtest: o esperado pelo modelo contra o realizado em campo, por faixa de chance, e a cobertura da fila."""

from datetime import date

import pytest

from app.features.loss_management.backtest_formulas import ChanceBand, FieldInspection, evaluate_selection
from app.features.loss_management.schemas import QueueSituation, SuspicionReason, SuspiciousUnitDTO


def make_unit(id_uc: str, chance: float, estimated_kwh: float) -> SuspiciousUnitDTO:
    return SuspiciousUnitDTO(
        id_uc=id_uc,
        municipio="RECIFE",
        bairro="BOA VIAGEM",
        classe_consumo="RESIDENCIAL",
        motivos=[SuspicionReason.QUEDA_MODERADA],
        score_risco=0.0,
        probabilidade_acerto=chance,
        consumo_base_kwh=100.0,
        consumo_recente_kwh=50.0,
        kwh_estimado_recuperar=estimated_kwh,
        valor_estimado_recuperar_rs=0.0,
        kwh_mes_recuperavel=estimated_kwh / 3,
        valor_ano_rs=0.0,
        situacao=QueueSituation.NA_FILA,
    )


def inspected(id_uc: str, *, irregular: bool, recovered_kwh: float | None = None) -> FieldInspection:
    return FieldInspection(id_uc, date(2025, 9, 10), irregular, recovered_kwh)


UNITS = {
    "ALTA": make_unit("ALTA", 0.925, 300.0),
    "RAMPA": make_unit("RAMPA", 0.5, 100.0),
    "BAIXA": make_unit("BAIXA", 0.079, 50.0),
}
SELECTION = dict.fromkeys(UNITS, SuspicionReason.QUEDA_MODERADA)
QUEUE_IDS = {"ALTA", "RAMPA", "BAIXA", "FORA_DO_TOPO"}  # a fila inteira: o top N mais uma UC abaixo dele
INSPECTIONS = [
    inspected("ALTA", irregular=True, recovered_kwh=400.0),
    inspected("RAMPA", irregular=False),
    inspected("BAIXA", irregular=True, recovered_kwh=60.0),
    inspected("FORA_DO_TOPO", irregular=True, recovered_kwh=80.0),  # na fila, mas abaixo do corte N
    inspected("SEM_SINAL", irregular=True, recovered_kwh=10.0),  # nem estava na fila
]


def outcome():
    return evaluate_selection(SELECTION, INSPECTIONS, units=UNITS, queue_ids=QUEUE_IDS)


def test_the_expected_energy_is_what_the_model_promised_for_the_inspected_units_only():
    assert outcome().prediction.expected_kwh == pytest.approx(300.0 * 0.925 + 100.0 * 0.5 + 50.0 * 0.079)
    assert outcome().kwh_recovered == pytest.approx(460.0)  # 400 + 0 + 60, sem as UCs fora da seleção


def test_the_mean_predicted_chance_is_taken_over_the_inspected_selected_units():
    assert outcome().prediction.mean_chance == pytest.approx((0.925 + 0.5 + 0.079) / 3)


def test_each_chance_band_compares_what_was_predicted_with_what_the_field_found():
    bands = {band.band: band for band in outcome().prediction.by_band}

    high, ramp, low = bands[ChanceBand.ALTA], bands[ChanceBand.RAMPA], bands[ChanceBand.BAIXA]
    assert (high.selected, high.inspected, high.irregular) == (1, 1, 1)
    assert (ramp.selected, ramp.inspected, ramp.irregular) == (1, 1, 0)
    assert (low.selected, low.inspected, low.irregular) == (1, 1, 1)
    assert high.expected_kwh == pytest.approx(277.5)
    assert high.recovered_kwh == pytest.approx(400.0)
    assert ramp.mean_chance == pytest.approx(0.5)
    assert ramp.rate == pytest.approx(0.0)


def test_the_coverage_counts_the_irregular_units_the_whole_queue_contained():
    result = outcome()

    assert result.window_irregular_units == 4  # ALTA, BAIXA, FORA_DO_TOPO e SEM_SINAL
    assert result.queue_irregular_units == 3  # as três primeiras estavam na fila, SEM_SINAL não


def test_without_the_units_the_new_measures_stay_empty_and_the_old_ones_do_not_change():
    result = evaluate_selection(SELECTION, INSPECTIONS)

    prediction = result.prediction
    assert (prediction.expected_kwh, prediction.mean_chance, prediction.by_band) == (0.0, None, [])
    assert result.selected_inspected == 3
    assert result.selected_irregular == 2
