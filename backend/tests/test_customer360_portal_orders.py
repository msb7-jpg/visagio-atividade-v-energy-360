from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.customer360.repository import Customer360Repository
from tests.customer360_seed import seed_customer360_tables

ORDERS_DDL = (
    "CREATE TABLE ordem_inspecao (id_inspecao INTEGER PRIMARY KEY, id_uc TEXT, status TEXT, data_inspecao DATE, "
    "inspetor TEXT, irregularidade_constatada BOOLEAN, tipo_irregularidade TEXT, kwh_recuperado REAL)"
)
ORDERS_INSERT = (
    "INSERT INTO ordem_inspecao VALUES (7, 'UC100003', 'concluida', '2026-11-03', 'INS01', 1, 'DESVIO', 300.0), "
    "(8, 'UC100003', 'pendente', NULL, NULL, NULL, NULL, NULL)"
)


async def _inspections(with_orders_table: bool):
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await seed_customer360_tables(connection)
        if with_orders_table:
            await connection.execute(text(ORDERS_DDL))
            await connection.execute(text(ORDERS_INSERT))
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        result = await Customer360Repository(session).fetch_loss_inspections("UC100003")
    await engine.dispose()
    return result


async def test_completed_order_listed_first():
    inspections = await _inspections(with_orders_table=True)

    assert [inspection.data_inspecao for inspection in inspections] == ["2026-11-03", "2025-11-04", "2025-08-12"]
    assert inspections[0].id_inspecao == "OS-7"
    assert inspections[0].id_inspetor == "INS01"
    assert inspections[0].irregularidade_constatada is True


async def test_missing_orders_table_is_tolerated():
    inspections = await _inspections(with_orders_table=False)

    assert [inspection.data_inspecao for inspection in inspections] == ["2025-11-04", "2025-08-12"]
