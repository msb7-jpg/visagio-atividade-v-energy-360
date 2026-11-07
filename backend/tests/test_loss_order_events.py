"""Trilha de auditoria das ordens: o que mudou, antes e depois, e quem mudou."""

from datetime import UTC, date, datetime

from app.features.loss_management.order_events import build_changes, event_type
from app.features.loss_management.schemas import InspectionOrderDTO, InspectionStatus

NOW = datetime(2026, 11, 6, 12, 0, tzinfo=UTC)


def _order(**overrides) -> InspectionOrderDTO:
    base = {
        "id_inspecao": 1,
        "id_uc": "UC1",
        "status": InspectionStatus.GERADA,
        "motivo": None,
        "kwh_estimado": 100.0,
        "fiscal_responsavel": None,
        "inspetor": None,
        "data_inspecao": None,
        "irregularidade_constatada": None,
        "tipo_irregularidade": None,
        "kwh_recuperado": None,
        "numero_toi": None,
        "justificativa_cancelamento": None,
        "motivo_cancelamento": None,
        "criado_por": "perdas@venergy.com",
        "criado_em": NOW,
        "atualizado_em": NOW,
    }
    return InspectionOrderDTO(**{**base, **overrides})


def test_changes_list_only_the_fields_that_changed_with_before_and_after():
    before = _order()
    after = _order(status=InspectionStatus.PENDENTE, inspetor="INSP-001")

    changes = build_changes(before, after)

    assert changes == {"status": ["gerada", "pendente"], "inspetor": [None, "INSP-001"]}


def test_changes_serialize_dates_and_numbers_for_the_audit_log():
    before = _order(status=InspectionStatus.PENDENTE)
    after = _order(
        status=InspectionStatus.CONCLUIDA,
        data_inspecao=date(2026, 11, 5),
        irregularidade_constatada=True,
        kwh_recuperado=1250.5,
    )

    changes = build_changes(before, after)

    assert changes["data_inspecao"] == [None, "2026-11-05"]
    assert changes["irregularidade_constatada"] == [None, True]
    assert changes["kwh_recuperado"] == [None, 1250.5]


def test_no_changes_when_nothing_audited_differs():
    assert build_changes(_order(), _order(atualizado_em=datetime(2026, 11, 7, tzinfo=UTC))) == {}


def test_event_type_follows_the_new_status():
    assert event_type(InspectionStatus.GERADA, InspectionStatus.PENDENTE) == "em_campo"
    assert event_type(InspectionStatus.PENDENTE, InspectionStatus.CONCLUIDA) == "concluida"
    assert event_type(InspectionStatus.GERADA, InspectionStatus.CANCELADA) == "cancelada"


def test_event_type_is_update_when_the_status_did_not_change():
    assert event_type(InspectionStatus.PENDENTE, InspectionStatus.PENDENTE) == "atualizada"
