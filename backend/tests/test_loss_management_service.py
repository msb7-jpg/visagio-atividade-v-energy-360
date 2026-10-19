import pytest

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspicionReason,
)
from app.features.loss_management.scoring import (
    ConsumptionProfile,
    build_suspicious_unit,
    rank_suspicious_units,
)
from app.features.loss_management.service import LossService, validate_transition
from app.shared.exceptions import BadRequestException


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


class FakeRepositoryWithActiveOrder:
    async def has_active_order(self, id_uc: str) -> bool:
        del id_uc
        return True


async def test_create_rejects_unit_with_active_order():
    service = LossService(repository=FakeRepositoryWithActiveOrder())  # type: ignore[arg-type]

    with pytest.raises(InspectionConflictError):
        await service.create_inspection(InspectionOrderCreateDTO(id_uc="UC1"), criado_por="perdas@venergy.com")
