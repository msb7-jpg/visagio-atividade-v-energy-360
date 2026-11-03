"""A fila sem filtro é calculada uma vez e refeita quando uma ordem do portal muda."""

from datetime import UTC, datetime

from sqlalchemy import column, select, table, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queue_rows_cache import cached_queue_rows

candidates = table("candidatas", column("id_uc"))
QUERY = select(candidates.c.id_uc).order_by(candidates.c.id_uc)
KEY = ("sem filtro", "2026-06")


async def test_reuses_the_rows_until_an_order_changes():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        await connection.execute(text("CREATE TABLE candidatas (id_uc TEXT)"))
        await connection.execute(text("INSERT INTO candidatas VALUES ('UC1')"))
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        first = await cached_queue_rows(session, KEY, QUERY, dict)
        await session.execute(text("INSERT INTO candidatas VALUES ('UC2')"))
        reused = await cached_queue_rows(session, KEY, QUERY, dict)

        session.add(InspectionOrder(id_uc="UC1", status="gerada", kwh_estimado=1.0, criado_por="perdas@venergy.com",
                                    atualizado_em=datetime.now(UTC)))
        await session.commit()
        refreshed = await cached_queue_rows(session, KEY, QUERY, dict)
    await engine.dispose()

    assert first == reused == [{"id_uc": "UC1"}]
    assert refreshed == [{"id_uc": "UC1"}, {"id_uc": "UC2"}]
