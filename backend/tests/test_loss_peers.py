"""Pares: a mediana de recente/base por classe de consumo, que separa a sazonalidade de uma queda anormal."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management import peers
from app.features.loss_management.backtest_schemas import BacktestFilterDTO
from app.features.loss_management.hit_curve import curve_hit_rate
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.peers import median_ratio_by_class
from app.features.loss_management.queries import SuspicionFilters, build_windows
from app.features.loss_management.queue_query import evaluated_profiles_query
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import SuspicionReason
from app.features.loss_management.scoring import ConsumptionProfile, build_suspicious_unit, detect_reasons
from app.features.loss_management.unit_detail import explain_reasons

TARIFF_RS_KWH = 0.7
QUEUE_FILTERS = SuspicionFilters(limiar_queda=0.2)
BASE_MONTHS = [f"2025-{month:02d}" for month in range(1, 13)]
RECENT_MONTHS = ["2026-01", "2026-02", "2026-03"]
REGISTRY_DDL = (
    "CREATE TABLE dim_unidade_consumidora "
    "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
)
MEASUREMENT_DDL = "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"
WINTER_PORTFOLIO_RATIO = 0.7  # inverno: a carteira (quase toda residencial) cai 30%
INDUSTRIAL_PEER_RATIO = 0.9  # a indústria quase não varia entre verão e inverno


def make_profile(classe: str, base_kwh: float, recent_kwh: float, peer_ratio: float | None = None):
    return ConsumptionProfile(
        id_uc="UC1",
        municipio="RECIFE",
        bairro="BOA VIAGEM",
        classe_consumo=classe,
        consumo_base_kwh=base_kwh,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=0,
        peer_ratio=peer_ratio,
    )


def test_median_by_class_uses_each_classes_own_median():
    ratios = {"RESIDENCIAL": [0.5, 0.6, 0.7], "INDUSTRIAL": [0.8, 0.9, 1.0]}

    result = median_ratio_by_class(ratios, fallback=0.75, min_units=3)

    assert result == {"RESIDENCIAL": pytest.approx(0.6), "INDUSTRIAL": pytest.approx(0.9)}


def test_median_by_class_falls_back_to_the_portfolio_when_the_class_is_too_small():
    ratios = {"RESIDENCIAL": [0.5, 0.6, 0.7], "RURAL": [0.4, 0.5]}

    result = median_ratio_by_class(ratios, fallback=0.75, min_units=3)

    assert result["RURAL"] == pytest.approx(0.75)
    assert result["RESIDENCIAL"] == pytest.approx(0.6)


def test_a_real_industrial_drop_in_winter_is_not_hidden_by_the_residential_median():
    industrial_drop = make_profile("INDUSTRIAL", base_kwh=1000.0, recent_kwh=650.0)
    with_global_median = build_suspicious_unit(industrial_drop, TARIFF_RS_KWH, portfolio_ratio=WINTER_PORTFOLIO_RATIO)
    with_peers = build_suspicious_unit(
        make_profile("INDUSTRIAL", 1000.0, 650.0, peer_ratio=INDUSTRIAL_PEER_RATIO),
        TARIFF_RS_KWH,
        portfolio_ratio=WINTER_PORTFOLIO_RATIO,
    )

    assert with_global_median.probabilidade_acerto == pytest.approx(0.076)
    relative_drop = 1 - 650.0 / 1000.0 / INDUSTRIAL_PEER_RATIO  # 27,8%: na rampa entre os patamares
    assert with_peers.probabilidade_acerto == pytest.approx(curve_hit_rate(relative_drop))
    assert with_peers.probabilidade_acerto > 0.5


def test_a_normal_residential_winter_drop_is_not_suspicious_with_peers():
    residential_winter = make_profile("RESIDENCIAL", 100.0, 72.0, peer_ratio=WINTER_PORTFOLIO_RATIO)

    assert build_suspicious_unit(residential_winter, TARIFF_RS_KWH, portfolio_ratio=1.0) is None


async def profiles_by_class(use_peers: bool) -> dict[str, float | None]:
    """Semeia 3 UCs residenciais, 3 industriais e 1 rural e devolve o `peer_ratio` do perfil de cada classe."""
    units = {
        "RESIDENCIAL": [40.0, 60.0, 70.0],
        "INDUSTRIAL": [50.0, 75.0, 90.0],
        "RURAL": [30.0],
    }
    profiles = await candidate_profiles(units, use_peers)
    return {profile.classe_consumo: profile.peer_ratio for profile in profiles}


async def run_seeded(units: dict[str, list[float]], use_peers: bool, action):
    """Semeia UCs `{classe: [consumo recente de cada UC]}` (base 100) e devolve `await action(repositório)`."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(InspectionOrder.metadata.create_all)
            await connection.execute(text(REGISTRY_DDL))
            await connection.execute(text(MEASUREMENT_DDL))
            for classe, recents in units.items():
                for position, recent_kwh in enumerate(recents):
                    id_uc = f"{classe[:3]}{position}"
                    await connection.execute(
                        text("INSERT INTO dim_unidade_consumidora VALUES (:id, 'Recife', 'Pina', :classe, 0)"),
                        {"id": id_uc, "classe": classe},
                    )
                    rows = [(id_uc, month, 100.0) for month in BASE_MONTHS]
                    rows += [(id_uc, month, recent_kwh) for month in RECENT_MONTHS]
                    await connection.execute(
                        text("INSERT INTO fato_medicao VALUES (:id, :month, :kwh)"),
                        [{"id": row[0], "month": row[1], "kwh": row[2]} for row in rows],
                    )
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            return await action(LossRepository(session, use_peers=use_peers))
    finally:
        await engine.dispose()


async def candidate_profiles(units: dict[str, list[float]], use_peers: bool) -> list[ConsumptionProfile]:
    async def fetch(repository: LossRepository) -> list[ConsumptionProfile]:
        return (await repository.fetch_consumption_profiles(QUEUE_FILTERS)).profiles

    return await run_seeded(units, use_peers, fetch)


async def test_profiles_carry_the_median_of_their_own_class(monkeypatch):
    monkeypatch.setattr(peers, "MIN_PEER_UNITS", 3)

    ratio_by_class = await profiles_by_class(use_peers=True)

    assert ratio_by_class["RESIDENCIAL"] == pytest.approx(0.6)
    assert ratio_by_class["INDUSTRIAL"] == pytest.approx(0.75)


async def test_a_class_below_the_minimum_uses_the_portfolio_median(monkeypatch):
    monkeypatch.setattr(peers, "MIN_PEER_UNITS", 3)

    ratio_by_class = await profiles_by_class(use_peers=True)

    assert ratio_by_class["RURAL"] == pytest.approx(0.6)  # mediana das 7 UCs da carteira


async def test_the_current_model_leaves_the_peer_ratio_empty():
    ratio_by_class = await profiles_by_class(use_peers=False)

    assert set(ratio_by_class.values()) == {None}


def test_reasons_use_the_drop_relative_to_the_pairs():
    normal_winter_drop = make_profile("RESIDENCIAL", 100.0, 72.0, peer_ratio=WINTER_PORTFOLIO_RATIO)

    assert detect_reasons(normal_winter_drop) == []
    assert detect_reasons(make_profile("RESIDENCIAL", 100.0, 72.0)) == [SuspicionReason.QUEDA_MODERADA]


def test_a_sudden_drop_is_measured_beyond_the_pairs():
    profile = make_profile("RESIDENCIAL", 100.0, 40.0, peer_ratio=WINTER_PORTFOLIO_RATIO)  # bruta 60%, relativa 43%

    assert detect_reasons(profile) == [SuspicionReason.QUEDA_MODERADA]
    assert detect_reasons(make_profile("RESIDENCIAL", 100.0, 40.0)) == [SuspicionReason.QUEDA_SUBITA]


def test_the_deficit_discounts_the_part_that_the_season_explains():
    unit = build_suspicious_unit(
        make_profile("RESIDENCIAL", 100.0, 50.0, peer_ratio=WINTER_PORTFOLIO_RATIO), TARIFF_RS_KWH
    )

    assert unit.kwh_mes_recuperavel == pytest.approx(20.0)  # esperado 70 kWh, consumiu 50
    assert unit.kwh_estimado_recuperar == pytest.approx(60.0)
    assert unit.valor_ano_rs == pytest.approx(20.0 * 12 * TARIFF_RS_KWH)


def test_the_deficit_is_the_raw_gap_without_pairs():
    unit = build_suspicious_unit(make_profile("RESIDENCIAL", 100.0, 50.0), TARIFF_RS_KWH)

    assert unit.kwh_mes_recuperavel == pytest.approx(50.0)


async def test_entry_uses_the_drop_relative_to_the_pairs_of_the_class(monkeypatch):
    monkeypatch.setattr(peers, "MIN_PEER_UNITS", 3)
    units = {"RESIDENCIAL": [55.0, 60.0, 70.0], "INDUSTRIAL": [50.0, 90.0, 95.0]}

    with_peers = await candidate_profiles(units, use_peers=True)
    without_peers = await candidate_profiles(units, use_peers=False)

    assert {profile.id_uc for profile in with_peers} == {"IND0"}
    assert {profile.id_uc for profile in without_peers} == {"RES0", "RES1", "RES2", "IND0"}


async def test_the_registered_unit_carries_the_peer_ratio_of_its_class(monkeypatch):
    monkeypatch.setattr(peers, "MIN_PEER_UNITS", 3)
    units = {"RESIDENCIAL": [40.0, 60.0, 70.0]}

    async def fetch(repository: LossRepository):
        return await repository.fetch_registered_unit("RES0")

    with_peers = await run_seeded(units, True, fetch)
    without_peers = await run_seeded(units, False, fetch)

    assert with_peers.profile.peer_ratio == pytest.approx(0.6)
    assert without_peers.profile.peer_ratio is None


async def test_the_out_of_queue_evaluation_uses_the_same_pairs_as_the_queue():
    units = {"RESIDENCIAL": [40.0, 60.0, 70.0]}  # com a mediana da classe em 0,6, só RES0 cai além dos pares

    async def evaluated_ids(repository: LossRepository, **pairs) -> set[str]:
        query = evaluated_profiles_query(build_windows("2026-03"), QUEUE_FILTERS, **pairs)
        return {row["id_uc"] for row in (await repository.session.execute(query)).mappings().all()}

    async def with_pairs(repository: LossRepository) -> set[str]:
        return await evaluated_ids(repository, peer_ratios={"RESIDENCIAL": 0.6}, portfolio_ratio=0.7)

    async def raw_drop(repository: LossRepository) -> set[str]:
        return await evaluated_ids(repository)

    assert await run_seeded(units, True, with_pairs) == {"RES0"}
    assert await run_seeded(units, False, raw_drop) == {"RES0", "RES1", "RES2"}


def test_the_unit_detail_explains_the_drop_against_the_pairs_and_the_curve():
    profile = make_profile("RESIDENCIAL", 100.0, 75.0, peer_ratio=1.0)

    sentence = explain_reasons(profile, detect_reasons(profile))

    assert "classe" in sentence
    assert "50%" in sentence  # queda relativa de 25%: no meio da rampa, chance de 50%


def test_the_backtest_runs_the_current_model_unless_told_otherwise():
    assert BacktestFilterDTO().modelo == "atual"
    assert BacktestFilterDTO(modelo="novo").modelo == "novo"
