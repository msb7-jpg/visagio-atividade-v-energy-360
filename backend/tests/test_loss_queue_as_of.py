"""A fila vista como estava num mês passado só considera ordens e cancelamentos do portal feitos até aquele mês."""

from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import create_engine, text

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters, build_windows
from app.features.loss_management.queue_query import CANCELLATION_BLOCK_DAYS, suspicious_profiles_query

AS_OF = date(2025, 9, 1)  # a fila de agosto/2025: o limite do histórico é exclusivo
AS_OF_START = datetime.combine(AS_OF, datetime.min.time())
DAYS_BEFORE_TODAY = 10  # bem depois da referência e dentro dos 90 dias contados a partir de hoje

SCHEMA_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT, irregularidade_constatada BOOLEAN)",
)
MONTHLY_KWH = (("2025-01", 300), ("2025-06", 100), ("2025-07", 100), ("2025-08", 100))

# (id_uc, status, irregularidade, motivo do cancelamento, data da última atualização da ordem)
ORDERS = (
    ("UC_CONCLUIDA_ANTES", "concluida", False, None, datetime(2025, 7, 20)),
    ("UC_CONCLUIDA_DEPOIS", "concluida", False, None, datetime(2025, 11, 20)),
    ("UC_CONCLUIDA_NO_LIMITE", "concluida", False, None, AS_OF_START),  # o limite é exclusivo: ainda não valia
    ("UC_CONCLUIDA_NO_ULTIMO_SEGUNDO", "concluida", False, None, AS_OF_START - timedelta(seconds=1)),
    ("UC_IRREGULAR_ANTES", "concluida", True, None, datetime(2025, 7, 20)),
    ("UC_IRREGULAR_DEPOIS", "concluida", True, None, datetime(2025, 11, 20)),
    ("UC_CANCELADA_ANTES", "cancelada", None, "cliente_regularizou", datetime(2025, 8, 20)),
    (
        "UC_CANCELADA_DEPOIS",
        "cancelada",
        None,
        "cliente_regularizou",
        datetime.now() - timedelta(days=DAYS_BEFORE_TODAY),
    ),
    (
        "UC_CANCELADA_ANTIGA",
        "cancelada",
        None,
        "cliente_regularizou",
        AS_OF_START - timedelta(days=CANCELLATION_BLOCK_DAYS + 30),
    ),
)


def queue_ids_as_of(history_until: date | None) -> list[str]:
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in SCHEMA_STATEMENTS:
            connection.execute(text(ddl_statement))
        for id_uc, status, irregular, cancellation_reason, updated_at in ORDERS:
            connection.execute(
                text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Recife', 'Centro', 'Residencial', 0)"),
                {"id_uc": id_uc},
            )
            for competencia, consumo_kwh in MONTHLY_KWH:
                connection.execute(
                    text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"),
                    {"id_uc": id_uc, "competencia": competencia, "consumo_kwh": consumo_kwh},
                )
            connection.execute(
                InspectionOrder.__table__.insert().values(
                    id_uc=id_uc,
                    status=status,
                    irregularidade_constatada=irregular,
                    motivo_cancelamento=cancellation_reason,
                    kwh_estimado=0,
                    criado_por="x",
                    criado_em=updated_at,
                    atualizado_em=updated_at,
                )
            )
        query = suspicious_profiles_query(
            build_windows("2025-08"), SuspicionFilters(limiar_queda=0.5), history_until=history_until
        )
        return sorted(row.id_uc for row in connection.execute(query))


def test_a_completed_order_made_after_the_reference_does_not_take_the_unit_out_of_the_queue():
    queue = queue_ids_as_of(AS_OF)

    assert "UC_CONCLUIDA_DEPOIS" in queue
    assert "UC_CONCLUIDA_ANTES" not in queue


def test_the_reference_limit_is_exclusive_to_the_second():
    queue = queue_ids_as_of(AS_OF)

    assert "UC_CONCLUIDA_NO_LIMITE" in queue
    assert "UC_CONCLUIDA_NO_ULTIMO_SEGUNDO" not in queue


def test_an_irregularity_found_after_the_reference_does_not_hold_the_unit_out_of_the_queue():
    queue = queue_ids_as_of(AS_OF)

    assert "UC_IRREGULAR_DEPOIS" in queue
    assert "UC_IRREGULAR_ANTES" not in queue


def test_a_blocking_cancellation_counts_ninety_days_back_from_the_reference_not_from_today():
    queue = queue_ids_as_of(AS_OF)

    assert "UC_CANCELADA_ANTES" not in queue
    assert "UC_CANCELADA_ANTIGA" in queue


def test_a_cancellation_made_after_the_reference_does_not_block_the_unit():
    assert "UC_CANCELADA_DEPOIS" in queue_ids_as_of(AS_OF)


@pytest.mark.parametrize("held_out_unit", ["UC_CONCLUIDA_ANTES", "UC_CONCLUIDA_DEPOIS", "UC_IRREGULAR_ANTES"])
def test_without_a_reference_every_completed_order_still_counts(held_out_unit):
    assert held_out_unit not in queue_ids_as_of(None)
