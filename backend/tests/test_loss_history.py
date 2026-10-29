"""Histórico mínimo: a chance de acerto medida em UCs com 12 meses de base não vale para ligações recentes."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.hit_rate import MESES_BASE_MINIMO, hit_probability, reason_hit_rate
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import SuspicionReason
from app.features.loss_management.scoring import ConsumptionProfile, build_suspicious_unit, detect_reasons
from app.features.loss_management.unit_detail import explain_reasons
from tests.loss_tariff import TARIFF_RS_KWH

WEAK_RATE = 0.076


def profile_with_base_months(base_months: int, recent_kwh: float = 195.0) -> ConsumptionProfile:
    return ConsumptionProfile(
        id_uc="UC_X",
        municipio="Recife",
        bairro="Iputinga",
        classe_consumo="Residencial",
        consumo_base_kwh=300.0,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=0,
        meses_base=base_months,
    )


def test_the_minimum_history_is_eleven_months_of_the_twelve_month_base():
    assert MESES_BASE_MINIMO == 11


@pytest.mark.parametrize("base_months", [12, 11])
def test_full_history_keeps_the_measured_rate(base_months):
    rate = reason_hit_rate(SuspicionReason.QUEDA_MODERADA, 0.35, base_months=base_months)

    assert rate == pytest.approx(0.915)


@pytest.mark.parametrize("base_months", [10, 6, 3, 1])
def test_short_history_is_never_rated_above_the_weak_rate(base_months):
    assert reason_hit_rate(SuspicionReason.QUEDA_MODERADA, 0.35, base_months=base_months) == pytest.approx(WEAK_RATE)
    assert hit_probability([SuspicionReason.QUEDA_SUBITA], base_months=base_months) == pytest.approx(WEAK_RATE)


def test_the_weak_rate_stays_as_is_for_a_unit_that_was_already_weak():
    rate = reason_hit_rate(SuspicionReason.QUEDA_MODERADA, 0.05, base_months=3)

    assert rate == pytest.approx(WEAK_RATE)


def test_unit_with_a_recent_connection_exposes_its_base_months_and_the_capped_chance():
    short = build_suspicious_unit(profile_with_base_months(3), TARIFF_RS_KWH)
    full = build_suspicious_unit(profile_with_base_months(12), TARIFF_RS_KWH)

    assert short is not None
    assert full is not None
    assert (short.meses_base, short.probabilidade_acerto) == (3, pytest.approx(WEAK_RATE))
    assert (full.meses_base, full.probabilidade_acerto) == (12, pytest.approx(0.915))
    assert short.kwh_mes_recuperavel == full.kwh_mes_recuperavel  # a energia a recuperar não muda


def test_reason_text_says_the_history_is_short_and_that_the_measured_rate_does_not_apply():
    profile = profile_with_base_months(3)

    sentence = explain_reasons(profile, detect_reasons(profile))

    assert "Ligação recente: só 3 meses de leitura na janela de base" in sentence
    assert "a chance medida em UCs com histórico completo não se aplica" in sentence
    assert "taxa fraca de 8%" in sentence
    assert "92%" not in sentence


def test_reason_text_of_a_full_history_has_no_short_history_warning():
    profile = profile_with_base_months(12)

    sentence = explain_reasons(profile, detect_reasons(profile))

    assert "Ligação recente" not in sentence


async def test_repository_counts_the_months_with_a_valid_reading_in_the_base_window():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    base_months = [f"2025-{month:02d}" for month in range(1, 13)]
    recent_months = ["2026-01", "2026-02", "2026-03"]
    try:
        async with engine.begin() as connection:
            await connection.run_sync(InspectionOrder.metadata.create_all)
            await connection.execute(
                text(
                    "CREATE TABLE dim_unidade_consumidora "
                    "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
                )
            )
            await connection.execute(text("CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"))
            for id_uc, months in {"UC_COMPLETA": base_months, "UC_NOVA": base_months[-3:]}.items():
                await connection.execute(
                    text("INSERT INTO dim_unidade_consumidora VALUES (:id, 'Recife', 'Pina', 'Residencial', 0)"),
                    {"id": id_uc},
                )
                readings = [(month, 300.0) for month in months] + [(month, 150.0) for month in recent_months]
                await connection.execute(
                    text("INSERT INTO fato_medicao VALUES (:id, :month, :kwh)"),
                    [{"id": id_uc, "month": month, "kwh": kwh} for month, kwh in readings],
                )
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            candidates = await LossRepository(session).fetch_consumption_profiles(SuspicionFilters(limiar_queda=0.2))
    finally:
        await engine.dispose()

    assert {profile.id_uc: profile.meses_base for profile in candidates.profiles} == {"UC_COMPLETA": 12, "UC_NOVA": 3}
