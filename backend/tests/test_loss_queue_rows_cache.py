"""A fila sem filtro é calculada uma vez e refeita quando uma ordem do portal é encerrada.

Ordens geradas ou pendentes não entram na conta: a fila só exclui UCs por ordem concluída ou cancelada, e a situação
das ordens ativas é lida a cada chamada, fora do cache.
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy import column, select, table, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queue_rows_cache import cached_queue_rows

candidates = table("candidatas", column("id_uc"))
QUERY = select(candidates.c.id_uc).order_by(candidates.c.id_uc)
KEY = ("sem filtro", "2026-06")


async def _add_order(session, status: str) -> None:
    session.add(
        InspectionOrder(
            id_uc="UC1",
            status=status,
            kwh_estimado=1.0,
            criado_por="perdas@venergy.com",
            atualizado_em=datetime.now(UTC),
        )
    )
    await session.commit()


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        await connection.execute(text("CREATE TABLE candidatas (id_uc TEXT)"))
        await connection.execute(text("INSERT INTO candidatas VALUES ('UC1')"))
    async with async_sessionmaker(engine, expire_on_commit=False)() as open_session:
        yield open_session
    await engine.dispose()


@pytest.mark.parametrize("closing_status", ["concluida", "cancelada"])
async def test_reuses_the_rows_until_an_order_is_closed(session, closing_status):
    first = await cached_queue_rows(session, KEY, QUERY, dict)
    await session.execute(text("INSERT INTO candidatas VALUES ('UC2')"))
    reused = await cached_queue_rows(session, KEY, QUERY, dict)

    await _add_order(session, closing_status)
    refreshed = await cached_queue_rows(session, KEY, QUERY, dict)

    assert first == reused == [{"id_uc": "UC1"}]
    assert refreshed == [{"id_uc": "UC1"}, {"id_uc": "UC2"}]


@pytest.mark.parametrize("active_status", ["gerada", "pendente"])
async def test_an_active_order_does_not_rebuild_the_rows(session, active_status):
    first = await cached_queue_rows(session, KEY, QUERY, dict)
    await session.execute(text("INSERT INTO candidatas VALUES ('UC2')"))

    await _add_order(session, active_status)
    reused = await cached_queue_rows(session, KEY, QUERY, dict)

    assert first == reused == [{"id_uc": "UC1"}]
