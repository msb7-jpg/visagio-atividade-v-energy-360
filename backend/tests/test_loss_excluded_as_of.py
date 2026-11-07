"""A aba "Fora da fila" numa referência passada lê as mesmas ordens e cancelamentos que a fila daquele mês."""

from datetime import date, datetime

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import build_windows
from app.features.loss_management.repository import LossRepository

AS_OF = date(2025, 9, 1)
WINDOWS = build_windows("2025-08")

# (id_uc, status, motivo do cancelamento, data da última atualização)
ORDERS = (
    ("UC_CANCELADA_ANTES", "cancelada", "cliente_regularizou", datetime(2025, 8, 20)),
    ("UC_CANCELADA_DEPOIS", "cancelada", "cliente_regularizou", datetime(2025, 11, 20)),
    ("UC_CANCELADA_ANTIGA", "cancelada", "cliente_regularizou", datetime(2025, 5, 1)),
    ("UC_CONCLUIDA_ANTES", "concluida", None, datetime(2025, 7, 20)),
    ("UC_CONCLUIDA_DEPOIS", "concluida", None, datetime(2025, 11, 20)),
)


@pytest.fixture
async def repository():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        session.add_all(
            InspectionOrder(
                id_uc=id_uc,
                status=status,
                motivo_cancelamento=cancellation_reason,
                kwh_estimado=0.0,
                criado_por="x",
                criado_em=updated_at,
                atualizado_em=updated_at,
            )
            for id_uc, status, cancellation_reason, updated_at in ORDERS
        )
        await session.commit()
        yield LossRepository(session)
    await engine.dispose()


async def test_cancellations_are_read_ninety_days_back_from_the_reference_and_never_after_it(repository):
    cancellation_dates = await repository.fetch_cancellation_dates(AS_OF)

    assert set(cancellation_dates) == {"UC_CANCELADA_ANTES"}


async def test_without_a_reference_cancellations_are_read_from_the_last_ninety_days(repository):
    assert await repository.fetch_cancellation_dates(None) == {}


async def test_completed_orders_after_the_reference_are_notfetch_inspection_events(repository):
    events = await repository.fetch_inspection_events(WINDOWS, AS_OF)

    assert set(events) == {"UC_CONCLUIDA_ANTES"}


async def test_without_a_reference_every_completed_order_is_an_inspection_event(repository):
    events = await repository.fetch_inspection_events(WINDOWS, None)

    assert set(events) == {"UC_CONCLUIDA_ANTES", "UC_CONCLUIDA_DEPOIS"}
