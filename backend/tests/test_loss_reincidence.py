"""Prazo de reincidência da fila: UC com irregularidade constatada fica fora por 12 meses.

Referência 2026-01: janela recente 2025-11 a 2026-01, janela de análise desde 2024-11-01 e prazo de reincidência
desde 2025-02-01. Inspeção sem irregularidade segue a janela de análise inteira (15 meses).
"""

from datetime import datetime

import pytest
from sqlalchemy import create_engine, text

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters, build_windows, reincidence_cutoff_date
from app.features.loss_management.queue_query import suspicious_profiles_query
from app.features.loss_management.scoring import LIMIAR_QUEDA_MODERADA

REFERENCE_COMPETENCIA = "2026-01"
BASE_KWH = 300
MODERATE_DROP_KWH = 200  # queda de 33%: candidata, mas abaixo da queda súbita
SUDDEN_DROP_KWH = 50  # queda de 83%

SCHEMA_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT, irregularidade_constatada BOOLEAN)",
)

# (id_uc, consumo recente, data da inspeção no histórico de campo, irregularidade constatada)
FIELD_HISTORY_CASES = (
    ("H_IRREGULAR_MODERADA", MODERATE_DROP_KWH, "2025-08-10", True),
    ("H_IRREGULAR_QUEDA_SUBITA", SUDDEN_DROP_KWH, "2025-08-10", True),
    ("H_IRREGULAR_NA_JANELA_RECENTE", SUDDEN_DROP_KWH, "2025-12-05", True),
    ("H_IRREGULAR_13_MESES", MODERATE_DROP_KWH, "2025-01-10", True),
    ("H_LIMPA_RECENTE", SUDDEN_DROP_KWH, "2025-08-10", False),
    ("H_LIMPA_13_MESES", MODERATE_DROP_KWH, "2025-01-10", False),
)

# (id_uc, consumo recente, conclusão da ordem, irregularidade constatada)
COMPLETED_ORDER_CASES = (
    ("O_IRREGULAR_MODERADA", MODERATE_DROP_KWH, datetime(2025, 8, 10), True),
    ("O_IRREGULAR_QUEDA_SUBITA", SUDDEN_DROP_KWH, datetime(2025, 8, 10), True),
    ("O_IRREGULAR_13_MESES", MODERATE_DROP_KWH, datetime(2025, 1, 10), True),
    ("O_LIMPA_RECENTE", SUDDEN_DROP_KWH, datetime(2025, 8, 10), False),
    ("O_LIMPA_13_MESES", MODERATE_DROP_KWH, datetime(2025, 1, 10), False),
)

EXPECTED_IN_QUEUE = {
    "H_IRREGULAR_MODERADA": False,  # irregular há 5 meses e sem queda súbita: ainda no prazo
    "H_IRREGULAR_QUEDA_SUBITA": True,  # nova queda súbita depois da regularização antecipa o retorno
    "H_IRREGULAR_NA_JANELA_RECENTE": False,  # a queda pode ser a de antes da inspeção: não conta como nova
    "H_IRREGULAR_13_MESES": True,  # passou dos 12 meses (antes ficava até 15)
    "H_LIMPA_RECENTE": False,  # sem irregularidade a janela é de 15 meses, mesmo com queda súbita
    "H_LIMPA_13_MESES": False,
    "O_IRREGULAR_MODERADA": False,
    "O_IRREGULAR_QUEDA_SUBITA": True,
    "O_IRREGULAR_13_MESES": True,
    "O_LIMPA_RECENTE": False,
    "O_LIMPA_13_MESES": False,
}


def _insert_unit(connection, id_uc: str, recent_kwh: float) -> None:
    connection.execute(
        text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Recife', 'Centro', 'Residencial', 0)"),
        {"id_uc": id_uc},
    )
    monthly_kwh = (("2025-06", BASE_KWH), ("2025-11", recent_kwh), ("2025-12", recent_kwh), ("2026-01", recent_kwh))
    for competencia, consumo_kwh in monthly_kwh:
        connection.execute(
            text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"),
            {"id_uc": id_uc, "competencia": competencia, "consumo_kwh": consumo_kwh},
        )


def _seed_field_history(connection) -> None:
    for id_uc, recent_kwh, inspected_on, was_irregular in FIELD_HISTORY_CASES:
        _insert_unit(connection, id_uc, recent_kwh)
        connection.execute(
            text("INSERT INTO fato_inspecoes_perdas VALUES (:id_uc, :inspected_on, :was_irregular)"),
            {"id_uc": id_uc, "inspected_on": inspected_on, "was_irregular": was_irregular},
        )


def _seed_completed_orders(connection) -> None:
    for id_uc, recent_kwh, completed_at, was_irregular in COMPLETED_ORDER_CASES:
        _insert_unit(connection, id_uc, recent_kwh)
        connection.execute(
            InspectionOrder.__table__.insert().values(
                id_uc=id_uc,
                status="concluida",
                kwh_estimado=0,
                irregularidade_constatada=was_irregular,
                criado_por="x",
                criado_em=completed_at,
                atualizado_em=completed_at,
            )
        )


def _queue_ids() -> set[str]:
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in SCHEMA_STATEMENTS:
            connection.execute(text(ddl_statement))
        _seed_field_history(connection)
        _seed_completed_orders(connection)
        query = suspicious_profiles_query(
            build_windows(REFERENCE_COMPETENCIA), SuspicionFilters(limiar_queda=LIMIAR_QUEDA_MODERADA)
        )
        return {row.id_uc for row in connection.execute(query)}


@pytest.fixture(scope="module")
def queue_ids() -> set[str]:
    return _queue_ids()


def test_reincidence_cutoff_is_twelve_competencias_counting_the_reference():
    assert reincidence_cutoff_date(build_windows(REFERENCE_COMPETENCIA)).isoformat() == "2025-02-01"


@pytest.mark.parametrize(("id_uc", "expected_in_queue"), sorted(EXPECTED_IN_QUEUE.items()))
def test_unit_enters_the_queue_according_to_the_reincidence_rule(queue_ids, id_uc, expected_in_queue):
    assert (id_uc in queue_ids) is expected_in_queue
