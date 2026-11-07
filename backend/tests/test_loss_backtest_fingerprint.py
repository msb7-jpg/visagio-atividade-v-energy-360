"""A chave do backtest muda com os dados Gold, com o código e com as ordens do portal que entram nos cortes."""

from datetime import datetime

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.backtest_fingerprint import code_version, compute_backtest_fingerprint
from app.features.loss_management.models import InspectionOrder
from tests.test_loss_backtest_router import SCHEMA

LAST_CUTOFF = "2025-09"
INSIDE_THE_CUTOFFS = datetime(2025, 8, 20)
AFTER_THE_LAST_CUTOFF = datetime(2026, 11, 7)


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        for statement in SCHEMA:
            await connection.execute(text(statement))
        await connection.execute(
            text("INSERT INTO dim_unidade_consumidora VALUES ('UC1', 'Residencial', 'Recife', 'Centro', 0)")
        )
        await connection.execute(text("INSERT INTO fato_medicao VALUES ('UC1', '2025-08', 100)"))
        await connection.execute(
            text("INSERT INTO fato_inspecoes_perdas VALUES ('I1', 'UC1', '2025-08-10', 1, 'INSP-001', 120.0)")
        )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as open_session:
        yield open_session
    await engine.dispose()


async def _add_completed_order(session, updated_at: datetime) -> None:
    session.add(
        InspectionOrder(
            id_uc="UC1",
            status="concluida",
            kwh_estimado=0.0,
            criado_por="x",
            criado_em=updated_at,
            atualizado_em=updated_at,
        )
    )
    await session.commit()


async def _execute(session, statement: str) -> None:
    await session.execute(text(statement))
    await session.commit()


async def test_the_fingerprint_is_stable_when_nothing_changes(session):
    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) == await compute_backtest_fingerprint(
        session, LAST_CUTOFF
    )


async def test_a_new_field_inspection_changes_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _execute(session, "INSERT INTO fato_inspecoes_perdas VALUES ('I2', 'UC1', '2025-09-02', 0, 'INSP-002', 0)")

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_new_measurement_changes_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _execute(session, "INSERT INTO fato_medicao VALUES ('UC1', '2025-09', 90)")

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_corrected_consumption_with_the_same_row_count_changes_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _execute(session, "UPDATE fato_medicao SET consumo_kwh = 90 WHERE id_uc = 'UC1'")

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_billing_change_changes_the_fingerprint_because_the_tariff_is_part_of_the_ranking(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _execute(session, "INSERT INTO fato_faturamento VALUES ('2025-08', 100.0, 50.0)")

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_registry_change_changes_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _execute(session, "UPDATE dim_unidade_consumidora SET possui_gd = 1 WHERE id_uc = 'UC1'")

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_portal_order_inside_the_cutoffs_changes_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _add_completed_order(session, INSIDE_THE_CUTOFFS)

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) != before


async def test_a_portal_order_made_after_the_last_cutoff_does_not_change_the_fingerprint(session):
    before = await compute_backtest_fingerprint(session, LAST_CUTOFF)

    await _add_completed_order(session, AFTER_THE_LAST_CUTOFF)

    assert await compute_backtest_fingerprint(session, LAST_CUTOFF) == before


async def test_another_last_cutoff_is_another_fingerprint(session):
    assert await compute_backtest_fingerprint(session, "2025-09") != await compute_backtest_fingerprint(
        session, "2025-08"
    )


def test_the_code_version_is_a_stable_digest():
    assert code_version() == code_version()
    assert len(code_version()) == 64
