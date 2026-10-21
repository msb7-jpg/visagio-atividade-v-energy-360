import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
)

AUTHOR = "perdas@venergy.com"


@pytest.fixture
async def repository():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield LossRepository(session)
    await engine.dispose()


async def test_database_rejects_second_active_order_for_same_unit(repository):
    await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)

    # Simula a corrida: a segunda requisição já passou pela checagem do serviço.
    with pytest.raises(InspectionConflictError):
        await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)


async def test_rejected_duplicate_keeps_session_usable(repository):
    await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)
    with pytest.raises(InspectionConflictError):
        await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)

    other_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC2"), AUTHOR)

    assert other_order.id_uc == "UC2"


async def test_cancelled_order_does_not_block_new_order_for_unit(repository):
    first_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)
    cancellation = InspectionOrderUpdateDTO(status=InspectionStatus.CANCELADA, justificativa_cancelamento="UC demolida")
    await repository.update_order(first_order.id_inspecao, cancellation)

    new_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR)

    assert new_order.status == InspectionStatus.GERADA


async def test_update_order_applies_only_informed_fields_of_dto(repository):
    created = await repository.create_order(
        InspectionOrderCreateDTO(id_uc="UC1", motivo="queda_subita", kwh_estimado=750.0), AUTHOR
    )
    dispatch = InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE, fiscal_responsavel="Fiscal Ana")

    updated = await repository.update_order(created.id_inspecao, dispatch)

    assert updated is not None
    assert updated.status == InspectionStatus.PENDENTE
    assert updated.fiscal_responsavel == "Fiscal Ana"
    assert updated.motivo == "queda_subita"
    assert updated.kwh_estimado == pytest.approx(750.0)


async def test_update_unknown_order_returns_none(repository):
    payload = InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE)

    assert await repository.update_order(999, payload) is None
