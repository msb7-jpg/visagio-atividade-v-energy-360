from unittest.mock import AsyncMock

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
)
from app.features.loss_management.scoring import QueueCandidates
from app.shared.exceptions import DatabaseReadError

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
    await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)

    # Simula a corrida: a segunda requisição já passou pela checagem do serviço.
    with pytest.raises(InspectionConflictError):
        await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)


async def test_rejected_duplicate_keeps_session_usable(repository):
    await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)
    with pytest.raises(InspectionConflictError):
        await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)

    other_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC2"), AUTHOR, kwh_estimado=0.0)

    assert other_order.id_uc == "UC2"


async def test_cancelled_order_does_not_block_new_order_for_unit(repository):
    first_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)
    cancellation = InspectionOrderUpdateDTO(status=InspectionStatus.CANCELADA, justificativa_cancelamento="UC demolida")
    await repository.update_order(first_order.id_inspecao, cancellation)

    new_order = await repository.create_order(InspectionOrderCreateDTO(id_uc="UC1"), AUTHOR, kwh_estimado=0.0)

    assert new_order.status == InspectionStatus.GERADA


async def test_update_order_applies_only_informed_fields_of_dto(repository):
    created = await repository.create_order(
        InspectionOrderCreateDTO(id_uc="UC1", motivo="queda_subita"), AUTHOR, kwh_estimado=750.0
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


QUEUE_FILTERS = SuspicionFilters(limiar_queda=0.5)
REGISTRY_AND_MEASUREMENT_DDL = (
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
)
FIELD_HISTORY_DDL = "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT)"
FIELD_HISTORY_OUTSIDE_CONTRACT_DDL = "CREATE TABLE fato_inspecoes_perdas (id_inspecao TEXT)"
ONE_MEASUREMENT_DML = "INSERT INTO fato_medicao VALUES ('UC1', '2026-01', 10)"


async def run_statements(repository: LossRepository, *statements: str) -> None:
    for statement in statements:
        await repository.session.execute(text(statement))


async def test_field_history_table_is_detected_only_when_exported(repository):
    assert await repository.has_field_history_table() is False

    await run_statements(repository, FIELD_HISTORY_DDL)

    assert await repository.has_field_history_table() is True


async def test_queue_without_measurements_still_reports_whether_history_was_applied(repository):
    await run_statements(repository, *REGISTRY_AND_MEASUREMENT_DDL)
    without_history = await repository.fetch_consumption_profiles(QUEUE_FILTERS)

    await run_statements(repository, FIELD_HISTORY_DDL)
    with_history = await repository.fetch_consumption_profiles(QUEUE_FILTERS)

    assert without_history == QueueCandidates(profiles=[], field_history_applied=False)
    assert with_history == QueueCandidates(profiles=[], field_history_applied=True)


async def test_failure_while_checking_history_table_is_a_read_error(repository, monkeypatch):
    database_error = OperationalError("PRAGMA table_info", {}, Exception("banco indisponível"))
    monkeypatch.setattr(repository, "has_field_history_table", AsyncMock(side_effect=database_error))

    with pytest.raises(DatabaseReadError):
        await repository.fetch_consumption_profiles(QUEUE_FILTERS)


async def test_history_table_outside_contract_is_a_read_error_not_a_warning(repository):
    await run_statements(
        repository, *REGISTRY_AND_MEASUREMENT_DDL, FIELD_HISTORY_OUTSIDE_CONTRACT_DDL, ONE_MEASUREMENT_DML
    )

    with pytest.raises(DatabaseReadError):
        await repository.fetch_consumption_profiles(QUEUE_FILTERS)
