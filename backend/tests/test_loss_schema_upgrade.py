from datetime import UTC, datetime
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.schema_upgrade import ADDED_COLUMN_NAMES, add_missing_columns

BACKEND_DIR = Path(__file__).resolve().parent.parent
EXISTING_ORDERS = 7
LEGACY_TABLE = """
CREATE TABLE ordem_inspecao (
    id_inspecao INTEGER NOT NULL PRIMARY KEY,
    id_uc VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    motivo VARCHAR(200),
    kwh_estimado FLOAT NOT NULL,
    fiscal_responsavel VARCHAR(120),
    irregularidade_constatada BOOLEAN,
    tipo_irregularidade VARCHAR(80),
    kwh_recuperado FLOAT,
    numero_toi VARCHAR(40),
    justificativa_cancelamento VARCHAR(500),
    criado_por VARCHAR(120) NOT NULL,
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL
)
"""


@pytest.fixture
async def legacy_engine(tmp_path):
    """Banco no formato anterior à mudança, com 7 ordens como as que já existem no ambiente."""
    engine = create_async_engine(f"sqlite+aiosqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    created_at = datetime(2026, 10, 28, 2, 48, tzinfo=UTC).replace(tzinfo=None).isoformat(sep=" ")
    async with engine.begin() as connection:
        await connection.execute(text(LEGACY_TABLE))
        await connection.execute(
            text(
                "INSERT INTO ordem_inspecao "
                "(id_uc, status, motivo, kwh_estimado, criado_por, criado_em, atualizado_em) "
                "VALUES (:id_uc, 'gerada', 'Queda moderada de consumo', 104.0, 'perdas@venergy.com', :ts, :ts)"
            ),
            [{"id_uc": f"UC10692{number}", "ts": created_at} for number in range(EXISTING_ORDERS)],
        )
    yield engine
    await engine.dispose()


async def column_names(engine) -> set[str]:
    async with engine.connect() as connection:
        columns = await connection.run_sync(lambda sync: inspect(sync).get_columns("ordem_inspecao"))
    return {column["name"] for column in columns}


async def test_upgrade_adds_the_three_columns_and_runs_twice_without_error(legacy_engine):
    async with legacy_engine.begin() as connection:
        first_run = await connection.run_sync(add_missing_columns)
    async with legacy_engine.begin() as connection:
        second_run = await connection.run_sync(add_missing_columns)

    assert first_run == list(ADDED_COLUMN_NAMES)
    assert second_run == []
    assert {"data_inspecao", "inspetor", "motivo_cancelamento"} <= await column_names(legacy_engine)


async def test_upgrade_keeps_the_existing_orders_valid_with_null_new_columns(legacy_engine):
    async with legacy_engine.begin() as connection:
        await connection.run_sync(add_missing_columns)
        await connection.run_sync(add_missing_columns)

    async with async_sessionmaker(legacy_engine, expire_on_commit=False)() as session:
        raw_rows = (await session.execute(text("SELECT * FROM ordem_inspecao ORDER BY id_inspecao"))).mappings().all()
        orm_orders = (await session.scalars(select(InspectionOrder))).all()

    assert len(raw_rows) == len(orm_orders) == EXISTING_ORDERS
    assert all(row["status"] == "gerada" and row["kwh_estimado"] == pytest.approx(104.0) for row in raw_rows)
    assert all(
        order.inspetor is None and order.data_inspecao is None and order.motivo_cancelamento is None
        for order in orm_orders
    )


async def test_upgrade_creates_the_table_when_the_database_is_new(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{(tmp_path / 'new.db').as_posix()}")
    async with engine.begin() as connection:
        added = await connection.run_sync(add_missing_columns)
    present = await column_names(engine)
    await engine.dispose()

    assert added == []
    assert {"id_inspecao", *ADDED_COLUMN_NAMES} <= present


async def test_alembic_upgrade_head_creates_operational_table_preserving_lakehouse_tables(tmp_path):
    db_file = tmp_path / "alembic_test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file.as_posix()}")
    async with engine.begin() as connection:
        await connection.execute(text("CREATE TABLE dim_tempo (ano INT, mes INT, competencia TEXT PRIMARY KEY)"))
        await connection.execute(text("INSERT INTO dim_tempo VALUES (2026, 6, '2026-06')"))

    alembic_cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_file.as_posix()}")

    command.upgrade(alembic_cfg, "head")

    present_cols = await column_names(engine)
    async with engine.connect() as connection:
        dim_count = (await connection.execute(text("SELECT COUNT(*) FROM dim_tempo"))).scalar_one()
        version_num = (await connection.execute(text("SELECT version_num FROM alembic_version"))).scalar_one()
    await engine.dispose()

    assert {"id_inspecao", *ADDED_COLUMN_NAMES} <= present_cols
    assert dim_count == 1
    assert version_num == "0001_ordem_inspecao"
