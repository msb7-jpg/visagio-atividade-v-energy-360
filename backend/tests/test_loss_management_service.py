from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.schemas import (
    CancellationReason,
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    QueueWarningCode,
    SuspicionReason,
    SuspiciousUnitsFilterDTO,
)
from app.features.loss_management.scoring import (
    ConsumptionProfile,
    QueueCandidates,
    RegisteredUnit,
    build_suspicious_unit,
    hit_probability,
    order_estimated_kwh,
    rank_suspicious_units,
)
from app.features.loss_management.service import LossService, validate_transition
from app.features.loss_management.tariff import AverageTariff
from app.shared.exceptions import BadRequestException, NotFoundException
from tests.loss_tariff import TARIFF_RS_KWH, TEST_TARIFF


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
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=50), TARIFF_RS_KWH)

    assert unit is not None
    assert unit.motivos == [SuspicionReason.QUEDA_SUBITA]
    assert unit.kwh_estimado_recuperar == pytest.approx(750.0)
    assert unit.valor_estimado_recuperar_rs == pytest.approx(562.5)
    assert unit.score_risco == pytest.approx(66.7)


def test_stable_consumption_is_not_suspicious():
    assert build_suspicious_unit(make_profile("UC1", base_kwh=200, recent_kwh=190), TARIFF_RS_KWH) is None


def test_moderate_drop_enters_the_ranked_queue_with_its_own_reason():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=195), TARIFF_RS_KWH)

    assert unit is not None
    assert unit.motivos == [SuspicionReason.QUEDA_MODERADA]
    assert unit.kwh_mes_recuperavel == pytest.approx(105.0)


def test_drop_just_below_the_floor_is_not_suspicious():
    assert build_suspicious_unit(make_profile("UC1", base_kwh=200, recent_kwh=170), TARIFF_RS_KWH) is None


def test_drop_of_exactly_half_is_a_sudden_drop_not_a_moderate_one():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=200, recent_kwh=100), TARIFF_RS_KWH)

    assert unit is not None
    assert unit.motivos == [SuspicionReason.QUEDA_SUBITA]


def test_hit_probability_of_a_moderate_drop_depends_on_its_band():
    assert hit_probability([SuspicionReason.QUEDA_MODERADA], drop_ratio=0.35) == pytest.approx(0.42)
    assert hit_probability([SuspicionReason.QUEDA_MODERADA], drop_ratio=0.25) == pytest.approx(0.07)


def test_unit_exposes_the_calibrated_probability_of_its_drop_band():
    strong_moderate = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=195), TARIFF_RS_KWH)
    weak_moderate = build_suspicious_unit(make_profile("UC2", base_kwh=300, recent_kwh=225), TARIFF_RS_KWH)

    assert strong_moderate is not None
    assert weak_moderate is not None
    assert strong_moderate.probabilidade_acerto == pytest.approx(0.42)
    assert weak_moderate.probabilidade_acerto == pytest.approx(0.07)


def test_ranking_puts_a_sudden_drop_ahead_of_a_larger_but_unlikelier_moderate_drop():
    large_weak_drop = make_profile("UC_QUEDA_FRACA_GRANDE", base_kwh=2000, recent_kwh=1500)
    small_sudden_drop = make_profile("UC_QUEDA_SUBITA", base_kwh=300, recent_kwh=100)

    ranked = rank_suspicious_units([large_weak_drop, small_sudden_drop], limit=2, tariff_rs_kwh=TARIFF_RS_KWH)

    assert [unit.id_uc for unit in ranked] == ["UC_QUEDA_SUBITA", "UC_QUEDA_FRACA_GRANDE"]


def test_zero_reading_is_flagged_even_without_large_drop():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=150, recent_kwh=130, zero_months=1), TARIFF_RS_KWH)

    assert unit is not None
    assert unit.motivos == [SuspicionReason.LEITURA_ZERADA]


def test_score_is_capped_at_100():
    unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=0, zero_months=3), TARIFF_RS_KWH)

    assert unit is not None
    assert unit.score_risco == pytest.approx(100.0)


def test_ranking_orders_by_recoverable_kwh_and_applies_limit():
    profiles = [
        make_profile("UC_PEQUENA", base_kwh=100, recent_kwh=10),
        make_profile("UC_GRANDE", base_kwh=1000, recent_kwh=100),
        make_profile("UC_NORMAL", base_kwh=100, recent_kwh=100),
    ]

    ranked = rank_suspicious_units(profiles, limit=1, tariff_rs_kwh=TARIFF_RS_KWH)

    assert [unit.id_uc for unit in ranked] == ["UC_GRANDE"]


def test_ranking_does_not_count_the_drop_twice_through_score_and_kwh():
    deep_drop_small_base = make_profile("UC_QUEDA_TOTAL", base_kwh=300, recent_kwh=0)
    moderate_drop_large_base = make_profile("UC_BASE_GRANDE", base_kwh=1000, recent_kwh=480)

    ranked = rank_suspicious_units(
        [deep_drop_small_base, moderate_drop_large_base], limit=2, tariff_rs_kwh=TARIFF_RS_KWH
    )

    assert [unit.id_uc for unit in ranked] == ["UC_BASE_GRANDE", "UC_QUEDA_TOTAL"]


def test_ranking_breaks_kwh_ties_by_risk_score():
    lower_risk = make_profile("UC_RISCO_MENOR", base_kwh=300, recent_kwh=100)
    higher_risk = make_profile("UC_RISCO_MAIOR", base_kwh=300, recent_kwh=100, zero_months=1)

    ranked = rank_suspicious_units([lower_risk, higher_risk], limit=2, tariff_rs_kwh=TARIFF_RS_KWH)

    assert [unit.id_uc for unit in ranked] == ["UC_RISCO_MAIOR", "UC_RISCO_MENOR"]


def test_hit_probability_uses_the_measured_rate_of_the_sudden_drop_signal():
    assert hit_probability([SuspicionReason.QUEDA_SUBITA]) == pytest.approx(0.93)


def test_hit_probability_falls_back_to_the_overall_rate_for_zero_reading_alone():
    assert hit_probability([SuspicionReason.LEITURA_ZERADA]) == pytest.approx(0.627)


def test_hit_probability_takes_the_strongest_signal_when_both_apply():
    both_signals = [SuspicionReason.QUEDA_SUBITA, SuspicionReason.LEITURA_ZERADA]

    assert hit_probability(both_signals) == pytest.approx(0.93)


def test_unit_exposes_the_hit_probability_of_its_signals():
    drop_unit = build_suspicious_unit(make_profile("UC1", base_kwh=300, recent_kwh=100), TARIFF_RS_KWH)
    zero_unit = build_suspicious_unit(make_profile("UC2", base_kwh=150, recent_kwh=100, zero_months=1), TARIFF_RS_KWH)

    assert drop_unit is not None
    assert zero_unit is not None
    assert drop_unit.probabilidade_acerto == pytest.approx(0.93)
    assert zero_unit.probabilidade_acerto == pytest.approx(0.627)


def test_ranking_prefers_the_likelier_hit_over_more_recoverable_kwh():
    more_kwh_less_likely = make_profile("UC_ZERADA_ISOLADA", base_kwh=1000, recent_kwh=700, zero_months=1)
    less_kwh_more_likely = make_profile("UC_QUEDA_SUBITA", base_kwh=330, recent_kwh=100)

    ranked = rank_suspicious_units([more_kwh_less_likely, less_kwh_more_likely], limit=2, tariff_rs_kwh=TARIFF_RS_KWH)

    assert ranked[0].kwh_estimado_recuperar < ranked[1].kwh_estimado_recuperar
    assert [unit.id_uc for unit in ranked] == ["UC_QUEDA_SUBITA", "UC_ZERADA_ISOLADA"]


def test_ranking_is_deterministic_when_kwh_and_score_tie():
    profiles = [make_profile(id_uc, base_kwh=300, recent_kwh=100) for id_uc in ("UC_C", "UC_A", "UC_B")]

    ranked = rank_suspicious_units(profiles, limit=3, tariff_rs_kwh=TARIFF_RS_KWH)
    reversed_ranked = rank_suspicious_units(list(reversed(profiles)), limit=3, tariff_rs_kwh=TARIFF_RS_KWH)

    assert [unit.id_uc for unit in ranked] == [unit.id_uc for unit in reversed_ranked] == ["UC_A", "UC_B", "UC_C"]


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


def test_cancellation_requires_a_reason_from_the_closed_list():
    with pytest.raises(ValidationError, match="Informe o motivo do cancelamento"):
        InspectionOrderUpdateDTO(status=InspectionStatus.CANCELADA, justificativa_cancelamento="Equipe realocada")
    with pytest.raises(ValidationError):
        InspectionOrderUpdateDTO(status=InspectionStatus.CANCELADA, motivo_cancelamento="porque sim")


def test_cancellation_with_listed_reason_is_valid_without_free_text():
    payload = InspectionOrderUpdateDTO(
        status=InspectionStatus.CANCELADA, motivo_cancelamento=CancellationReason.ORDEM_DUPLICADA
    )

    validate_transition(InspectionStatus.GERADA, payload)


@pytest.mark.parametrize("code", ["INSP-000", "INSP-041", "INSP-1", "FISCAL-3", "insp 001", ""])
def test_inspector_outside_the_roster_is_rejected(code):
    with pytest.raises(ValidationError, match="INSP-001 a INSP-040"):
        InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE, inspetor=code)


def test_inspector_code_is_normalized_and_accepted_at_the_roster_edges():
    first = InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE, inspetor=" insp-001 ")
    last = InspectionOrderUpdateDTO(status=InspectionStatus.PENDENTE, inspetor="INSP-040")

    assert (first.inspetor, last.inspetor) == ("INSP-001", "INSP-040")


def test_future_inspection_date_is_rejected_but_today_is_accepted():
    today = datetime.now(UTC).date()

    accepted = InspectionOrderUpdateDTO(
        status=InspectionStatus.CONCLUIDA, irregularidade_constatada=False, data_inspecao=today
    )
    with pytest.raises(ValidationError, match="não pode ser futura"):
        InspectionOrderUpdateDTO(
            status=InspectionStatus.CONCLUIDA, irregularidade_constatada=False, data_inspecao=today + timedelta(days=1)
        )

    assert accepted.data_inspecao == today


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
        "fiscal_responsavel": None, "inspetor": None, "data_inspecao": None, "irregularidade_constatada": None,
        "tipo_irregularidade": None, "kwh_recuperado": None, "numero_toi": None,
        "justificativa_cancelamento": None, "motivo_cancelamento": None,
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
                status=InspectionStatus.CANCELADA,
                motivo_cancelamento=CancellationReason.REPRIORIZACAO_EQUIPE,
                kwh_recuperado=10,
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


class FakeQueueRepository:
    """Repositório da fila: devolve candidatos prontos e informa se o histórico de campo foi aplicado."""

    def __init__(self, candidates: QueueCandidates) -> None:
        self.candidates = candidates

    async def fetch_consumption_profiles(self, filters: SuspicionFilters) -> QueueCandidates:
        del filters
        return self.candidates

    async def fetch_average_tariff(self) -> AverageTariff:
        return TEST_TARIFF


async def test_queue_warns_when_field_history_was_not_applied():
    profile = make_profile("UC1", base_kwh=300, recent_kwh=50)
    candidates = QueueCandidates(profiles=[profile], field_history_applied=False)
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO())

    assert [unit.id_uc for unit in queue.itens] == ["UC1"]
    assert [warning.codigo for warning in queue.avisos] == [QueueWarningCode.HISTORICO_CAMPO_NAO_APLICADO]


async def test_queue_warns_when_a_fixed_reference_competencia_is_used():
    profile = make_profile("UC1", base_kwh=300, recent_kwh=50)
    candidates = QueueCandidates(profiles=[profile], field_history_applied=True, reference_competencia="2025-08")
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO())

    assert [warning.codigo for warning in queue.avisos] == [QueueWarningCode.COMPETENCIA_REFERENCIA_FIXADA]
    assert "2025-08" in queue.avisos[0].mensagem


async def test_queue_has_no_warnings_when_field_history_was_applied():
    profile = make_profile("UC1", base_kwh=300, recent_kwh=50)
    candidates = QueueCandidates(profiles=[profile], field_history_applied=True)
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO())

    assert [unit.id_uc for unit in queue.itens] == ["UC1"]
    assert queue.avisos == []
