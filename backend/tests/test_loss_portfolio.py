"""Mediana da carteira: a queda geral de consumo que a chance de acerto de cada UC desconta."""

import asyncio

import pytest
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.repository import LossRepository

QUEUE_FILTERS = SuspicionFilters(limiar_queda=0.2)
BASE_MONTHS = [f"2025-{month:02d}" for month in range(1, 13)]
RECENT_MONTHS = ["2026-01", "2026-02", "2026-03"]
REGISTRY_DDL = (
    "CREATE TABLE dim_unidade_consumidora "
    "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
)
MEASUREMENT_DDL = "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"


async def ratio_of_portfolio(units: dict[str, tuple[float, float, bool]], filters=QUEUE_FILTERS) -> float:
    """Semeia UCs `{id: (base, recente, possui_gd)}` num banco novo e lê a razão recente/base da carteira."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(InspectionOrder.metadata.create_all)
            await connection.execute(text(REGISTRY_DDL))
            await connection.execute(text(MEASUREMENT_DDL))
            for id_uc, (base_kwh, recent_kwh, has_solar) in units.items():
                await connection.execute(
                    text("INSERT INTO dim_unidade_consumidora VALUES (:id, 'Recife', 'Pina', 'Residencial', :gd)"),
                    {"id": id_uc, "gd": has_solar},
                )
                rows = [(id_uc, month, base_kwh) for month in BASE_MONTHS]
                rows += [(id_uc, month, recent_kwh) for month in RECENT_MONTHS]
                await connection.execute(
                    text("INSERT INTO fato_medicao VALUES (:id, :month, :kwh)"),
                    [{"id": row[0], "month": row[1], "kwh": row[2]} for row in rows],
                )
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            candidates = await LossRepository(session).fetch_consumption_profiles(filters)
            return candidates.portfolio_ratio
    finally:
        await engine.dispose()


async def test_portfolio_ratio_is_the_median_of_recent_over_base():
    units = {
        "UC1": (100.0, 50.0, False),
        "UC2": (100.0, 80.0, False),
        "UC3": (100.0, 90.0, False),
        "UC4": (100.0, 100.0, False),
        "UC5": (100.0, 120.0, False),
    }

    assert await ratio_of_portfolio(units) == pytest.approx(0.9)


async def test_portfolio_ratio_of_an_even_count_is_the_mean_of_the_two_middle_units():
    units = {
        "UC1": (100.0, 60.0, False),
        "UC2": (100.0, 80.0, False),
        "UC3": (100.0, 100.0, False),
        "UC4": (100.0, 120.0, False),
    }

    assert await ratio_of_portfolio(units) == pytest.approx(0.9)


async def test_portfolio_ratio_counts_every_unit_even_with_solar_and_ignores_the_queue_filters():
    units = {"UC1": (100.0, 50.0, True), "UC2": (100.0, 70.0, False), "UC3": (100.0, 100.0, False)}
    filtered_out = SuspicionFilters(limiar_queda=0.2, municipio="Olinda")

    assert await ratio_of_portfolio(units, filtered_out) == pytest.approx(0.7)


async def test_portfolio_ratio_skips_units_without_a_base_and_defaults_to_one_without_measurements():
    assert await ratio_of_portfolio({"UC1": (0.0, 0.0, False), "UC2": (100.0, 80.0, False)}) == pytest.approx(0.8)
    assert await ratio_of_portfolio({}) == pytest.approx(1.0)


async def test_simultaneous_requests_run_the_heavy_portfolio_query_once():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    statements: list[str] = []
    event.listen(engine.sync_engine, "before_cursor_execute", lambda *args: statements.append(args[2]))
    try:
        async with engine.begin() as connection:
            await connection.execute(text(REGISTRY_DDL))
            await connection.execute(text(MEASUREMENT_DDL))
            rows = [{"id": "UC1", "month": month, "kwh": 100.0} for month in BASE_MONTHS + RECENT_MONTHS]
            await connection.execute(text("INSERT INTO fato_medicao VALUES (:id, :month, :kwh)"), rows)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        async def ratio_in_new_session() -> float:
            async with session_factory() as session:
                return await LossRepository(session).fetch_portfolio_ratio("2026-03")

        ratios = await asyncio.gather(*(ratio_in_new_session() for _ in range(4)))
    finally:
        await engine.dispose()

    assert ratios == [pytest.approx(1.0)] * 4
    portfolio_queries = [sql for sql in statements if sql.lstrip().startswith("SELECT") and "fato_medicao" in sql]
    assert len(portfolio_queries) == 1
