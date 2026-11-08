"""Chance de acerto pela queda relativa aos pares: dois patamares medidos e uma rampa na faixa sem medição."""

import pytest

from app.features.loss_management.hit_curve import (
    LIMIAR_QUEDA_ALTA,
    LIMIAR_QUEDA_BAIXA,
    TAXA_ACERTO_ALTA,
    TAXA_ACERTO_BAIXA,
    curve_hit_rate,
)
from app.features.loss_management.hit_rate import TAXA_ACERTO_HISTORICO_CURTO, hit_probability, reason_hit_rate
from app.features.loss_management.schemas import SuspicionReason
from app.features.loss_management.scoring import ConsumptionProfile, build_suspicious_unit

TARIFF_RS_KWH = 0.7
MIDPOINT_RATE = (TAXA_ACERTO_BAIXA + TAXA_ACERTO_ALTA) / 2
MIDPOINT_DROP = (LIMIAR_QUEDA_BAIXA + LIMIAR_QUEDA_ALTA) / 2


def make_profile(recent_kwh: float, *, peer_ratio: float | None, zero_months: int = 0, base_months: int = 12):
    return ConsumptionProfile(
        id_uc="UC1",
        municipio="RECIFE",
        bairro="BOA VIAGEM",
        classe_consumo="RESIDENCIAL",
        consumo_base_kwh=100.0,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=zero_months,
        meses_base=base_months,
        peer_ratio=peer_ratio,
    )


def test_below_the_low_threshold_the_chance_is_the_low_plateau():
    assert curve_hit_rate(0.0) == pytest.approx(TAXA_ACERTO_BAIXA)
    assert curve_hit_rate(LIMIAR_QUEDA_BAIXA) == pytest.approx(TAXA_ACERTO_BAIXA)


def test_from_the_high_threshold_on_the_chance_is_the_high_plateau_and_stays_flat():
    assert curve_hit_rate(LIMIAR_QUEDA_ALTA) == pytest.approx(TAXA_ACERTO_ALTA)
    assert curve_hit_rate(0.6) == pytest.approx(TAXA_ACERTO_ALTA)
    assert curve_hit_rate(1.0) == pytest.approx(TAXA_ACERTO_ALTA)


def test_between_the_thresholds_the_chance_rises_in_a_straight_line():
    assert curve_hit_rate(MIDPOINT_DROP) == pytest.approx(MIDPOINT_RATE)


def test_the_curve_never_decreases_with_the_drop():
    drops = [step / 100 for step in range(101)]

    rates = [curve_hit_rate(drop) for drop in drops]

    assert rates == sorted(rates)


def test_the_measured_curve_replaces_the_sudden_and_moderate_steps():
    sudden = reason_hit_rate(SuspicionReason.QUEDA_SUBITA, 0.6, measured_curve=True)
    moderate = reason_hit_rate(SuspicionReason.QUEDA_MODERADA, MIDPOINT_DROP, measured_curve=True)

    assert sudden == pytest.approx(TAXA_ACERTO_ALTA)
    assert moderate == pytest.approx(MIDPOINT_RATE)


def test_the_current_model_keeps_its_steps_unless_the_curve_is_asked_for():
    assert reason_hit_rate(SuspicionReason.QUEDA_MODERADA, MIDPOINT_DROP) == pytest.approx(0.915)
    assert reason_hit_rate(SuspicionReason.QUEDA_SUBITA, 0.6) == pytest.approx(0.93)


def test_a_zero_reading_keeps_its_general_rate_under_the_curve():
    rate = hit_probability([SuspicionReason.LEITURA_ZERADA], 0.0, measured_curve=True)

    assert rate == pytest.approx(0.627)


def test_the_highest_signal_wins_when_a_unit_has_more_than_one():
    reasons = [SuspicionReason.QUEDA_MODERADA, SuspicionReason.LEITURA_ZERADA]

    rate = hit_probability(reasons, MIDPOINT_DROP, measured_curve=True)

    assert rate == pytest.approx(0.627)  # a rampa vale 50%, a leitura zerada isolada vale 62,7%


def test_a_short_history_still_caps_the_chance_under_the_curve():
    rate = reason_hit_rate(SuspicionReason.QUEDA_SUBITA, 0.6, base_months=8, measured_curve=True)

    assert rate == pytest.approx(TAXA_ACERTO_HISTORICO_CURTO)


def test_a_unit_with_pairs_gets_the_curve_in_the_suspicious_queue():
    in_the_ramp = build_suspicious_unit(make_profile(75.0, peer_ratio=1.0), TARIFF_RS_KWH)  # queda relativa 25%
    beyond_it = build_suspicious_unit(make_profile(50.0, peer_ratio=1.0), TARIFF_RS_KWH)  # queda relativa 50%

    assert in_the_ramp.probabilidade_acerto == pytest.approx(MIDPOINT_RATE)
    assert beyond_it.probabilidade_acerto == pytest.approx(TAXA_ACERTO_ALTA)


def test_a_unit_without_pairs_keeps_the_current_steps_in_the_suspicious_queue():
    unit = build_suspicious_unit(make_profile(75.0, peer_ratio=None), TARIFF_RS_KWH)

    assert unit.probabilidade_acerto == pytest.approx(0.915)
