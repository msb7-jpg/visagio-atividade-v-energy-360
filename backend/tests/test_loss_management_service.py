from datetime import UTC, datetime

import pytest

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspicionReason,
)
from app.features.loss_management.scoring import (
    ConsumptionProfile,
    RegisteredUnit,
    build_suspicious_unit,
    order_estimated_kwh,
    rank_suspicious_units,
)
from app.features.loss_management.service import LossService, validate_transition
from app.shared.exceptions import BadRequestException, NotFoundException


def make_profile(id_uc: str, base_kwh: float, recent_kwh: float, zero_months: int = 0) -> ConsumptionProfile:
    return ConsumptionProfile(
        id_uc=id_uc,
        municipio="Recife",
        bairro="Boa Viagem",
        classe_consumo="Residencial",
        consumo_base_kwh=base_kwh,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=zero_months,
    )


def make_unit(base_kwh: float, recent_kwh: float, possui_gd: bool = False) -> RegisteredUnit:
    profile = make_profile("UC1", base_kwh=base_kwh, recent_kwh=recent_kwh)
    return RegisteredUnit(profile=profile, possui_gd=possui_gd, has_recent_reading=True)


def test_sudden_drop_is_flagged_with_recoverable_energy():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=50))

    assert unit is not None
    assert unit.motivos == [SuspicionReason.QUEDA_SUBITA]
    assert unit.kwh_estimado_recuperar == pytest.approx(750.0)
    assert unit.valor_estimado_recuperar_rs == pytest.approx(637.5)
    assert unit.score_risco == pytest.approx(66.7)


def test_stable_consumption_is_not_suspicious():
    assert build_suspicious_unit(make_profile("UC1", base_kwh=200, recent_kwh=190)) is None


def test_zero_reading_is_flagged_even_without_large_drop():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=150, recent_kwh=100, zero_months=1))

    assert unit is not None
    assert unit.motivos == [SuspicionReason.LEITURA_ZERADA]


def test_score_is_capped_at_100():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=0, zero_months=3))

    assert unit is not None
    assert unit.score_risco == pytest.approx(100.0)


def test_ranking_orders_by_expected_recovery_and_applies_limit():
    profiles = [
        make_profile("UC_PEQUENA", base_kwh=100, recent_kwh=10),
        make_profile("UC_GRANDE", base_kwh=1000, recent_kwh=100),
        make_profile("UC_NORMAL", base_kwh=100, recent_kwh=100),
    ]

    ranked = rank_suspicious_units(profiles, limit=1)

    assert [unit.id_uc for unit in ranked] == ["UC_GRANDE"]


@pytest.mark.parametrize(
    ("current_status", "target_status"),
    [
        (InspectionStatus.GERADA, InspectionStatus.CONCLUIDA),
        (InspectionStatus.CONCLUIDA, InspectionStatus.PENDENTE),
        (InspectionStatus.CANCELADA, InspectionStatus.GERADA),
    ],
)
def test_invalid_transitions_are_rejected(current_status, target_status):
    payload = InspectionOrderUpdateDTO(status=target_status, irregularidade_constatada=True)

    with pytest.raises(InspectionConflictError):
        validate_transition(current_status, payload)


def test_conclusion_requires_field_result():
    payload = InspectionOrderUpdateDTO(status=InspectionStatus.CONCLUIDA)

    with pytest.raises(BadRequestException):
        validate_transition(InspectionStatus.PENDENTE, payload)


def test_cancellation_requires_non_blank_justification():
    payload = InspectionOrderUpdateDTO(status=InspectionStatus.CANCELADA, justificativa_cancelamento="   ")

    with pytest.raises(BadRequestException):
        validate_transition(InspectionStatus.GERADA, payload)


def test_order_kwh_matches_queue_for_suspicious_unit():
    unit = make_unit(300.0, 50.0)

    assert order_estimated_kwh(unit) == pytest.approx(750.0)


def test_order_kwh_is_zero_for_unit_without_suspicion():
    unit = make_unit(200.0, 200.0)

    assert order_estimated_kwh(unit) == pytest.approx(0.0)


def test_order_kwh_is_zero_for_unit_with_distributed_generation():
    unit = make_unit(300.0, 50.0, possui_gd=True)

    assert order_estimated_kwh(unit) == pytest.approx(0.0)


def test_order_kwh_is_zero_for_unit_without_recent_reading():
    profile = make_profile("UC1", base_kwh=300.0, recent_kwh=0.0)
    unit = RegisteredUnit(profile=profile, possui_gd=False, has_recent_reading=False)

    assert order_estimated_kwh(unit) == pytest.approx(0.0)


class FakeCreationRepository:
    """Repositório de criação: cadastro opcional, ordem ativa configurável e registro do kWh gravado."""

    def __init__(self, registered_unit: RegisteredUnit | None, has_active: bool = False) -> None:
        self.registered_unit = registered_unit
        self.has_active = has_active
        self.saved_kwh: float | None = None

    async def fetch_registered_unit(self, id_uc: str) -> RegisteredUnit | None:
        del id_uc
        return self.registered_unit

    async def has_active_order(self, id_uc: str) -> bool:
        del id_uc
        return self.has_active

    async def create_order(
        self, payload: InspectionOrderCreateDTO, criado_por: str, *, kwh_estimado: float
    ) -> InspectionOrderDTO:
        del criado_por
        self.saved_kwh = kwh_estimado
        return make_order_dto(InspectionStatus.GERADA, id_uc=payload.id_uc, kwh_estimado=kwh_estimado)


SUSPICIOUS_UNIT = make_unit(300.0, 50.0)


async def test_create_rejects_unit_with_active_order():
    service = LossService(repository=FakeCreationRepository(SUSPICIOUS_UNIT, has_active=True))  # type: ignore[arg-type]

    with pytest.raises(InspectionConflictError):
        await service.create_inspection(InspectionOrderCreateDTO(id_uc="UC1"), criado_por="perdas@venergy.com")


async def test_create_rejects_unit_missing_from_registry():
    repository = FakeCreationRepository(None)
    service = LossService(repository=repository)  # type: ignore[arg-type]

    with pytest.raises(NotFoundException):
        await service.create_inspection(InspectionOrderCreateDTO(id_uc="UC_X"), criado_por="perdas@venergy.com")
    assert repository.saved_kwh is None


async def test_create_saves_kwh_computed_by_server():
    repository = FakeCreationRepository(SUSPICIOUS_UNIT)
    service = LossService(repository=repository)  # type: ignore[arg-type]

    created = await service.create_inspection(InspectionOrderCreateDTO(id_uc="UC1"), criado_por="perdas@venergy.com")

    assert repository.saved_kwh == pytest.approx(750.0)
    assert created.kwh_estimado == pytest.approx(750.0)


def make_order_dto(status: InspectionStatus, **overrides: object) -> InspectionOrderDTO:
    order_fields = {
        "id_inspecao": 7, "id_uc": "UC1", "status": status, "motivo": None, "kwh_estimado": 750.0,
        "fiscal_responsavel": None, "irregularidade_constatada": None, "tipo_irregularidade": None,
        "kwh_recuperado": None, "numero_toi": None, "justificativa_cancelamento": None,
        "criado_por": "perdas@venergy.com", "criado_em": datetime(2026, 10, 20, tzinfo=UTC),
        "atualizado_em": datetime(2026, 10, 20, tzinfo=UTC),
    }
    return InspectionOrderDTO(**(order_fields | overrides))


class FakeDtoOnlyRepository:
    """Repositório que só expõe DTOs: o serviço não pode depender de objetos ORM."""

    def __init__(self, stored_order: InspectionOrderDTO | None) -> None:
        self.stored_order = stored_order
        self.applied_payload: InspectionOrderUpdateDTO | None = None

    async def get_order(self, id_inspecao: int) -> InspectionOrderDTO | None:
        del id_inspecao
        return self.stored_order

    async def update_order(self, id_inspecao: int, payload: InspectionOrderUpdateDTO) -> InspectionOrderDTO:
        del id_inspecao
        self.applied_payload = payload
        assert self.stored_order is not None
        return self.stored_order.model_copy(update=payload.model_dump(exclude_none=True))


async def test_update_inspection_delegates_persistence_to_repository_with_dtos():
    repository = FakeDtoOnlyRepository(make_order_dto(InspectionStatus.GERADA))
    service = LossService(repository=repository)  # type: ignore[arg-type]

    payload = InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE)

    updated = await service.update_inspection(7, payload)

    assert updated.status == InspectionStatus.PENDENTE
    assert repository.applied_payload == payload


async def test_update_unknown_inspection_raises_not_found():
    service = LossService(repository=FakeDtoOnlyRepository(None))  # type: ignore[arg-type]

    with pytest.raises(NotFoundException):
        await service.update_inspection(99, InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE))


@pytest.mark.parametrize(
    ("current_status", "payload"),
    [
        (InspectionStatus.GERADA, InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE, numero_toi="TOI-1")),
        (
            InspectionStatus.PENDENTE,
            InspectionOrderUpdateDTO(
                status=InspectionStatus.CONCLUIDA, irregularidade_constatada=True, justificativa_cancelamento="x"
            ),
        ),
        (
            InspectionStatus.GERADA,
            InspectionOrderUpdateDTO(
                status=InspectionStatus.CANCELADA, justificativa_cancelamento="Equipe realocada", kwh_recuperado=10
            ),
        ),
    ],
)
def test_fields_outside_target_status_are_rejected(current_status, payload):
    with pytest.raises(BadRequestException):
        validate_transition(current_status, payload)


def test_conclusion_without_irregularity_rejects_irregularity_details():
    payload = InspectionOrderUpdateDTO(
        status=InspectionStatus.CONCLUIDA, irregularidade_constatada=False, kwh_recuperado=120.0
    )

    with pytest.raises(BadRequestException):
        validate_transition(InspectionStatus.PENDENTE, payload)


def test_conclusion_with_irregularity_accepts_field_details():
    payload = InspectionOrderUpdateDTO(
        status=InspectionStatus.CONCLUIDA,
        irregularidade_constatada=True,
        tipo_irregularidade="desvio",
        kwh_recuperado=680.0,
        numero_toi="TOI-1",
        fiscal_responsavel="Equipe 3",
    )

    validate_transition(InspectionStatus.PENDENTE, payload)
