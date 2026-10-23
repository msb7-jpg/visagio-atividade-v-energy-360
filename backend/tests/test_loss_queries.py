from datetime import date

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.dialects import mysql, postgresql, sqlite

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import (
    SuspicionFilters,
    build_windows,
    inspection_cutoff_date,
    shift_competencia,
)
from app.features.loss_management.queue_query import suspicious_profiles_query
from app.features.loss_management.reference import resolve_analysis_reference


@pytest.mark.parametrize(
    ("competencia", "months", "expected"),
    [
        ("2026-01", -2, "2025-11"),
        ("2025-11", -12, "2024-11"),
        ("2025-12", 1, "2026-01"),
        ("2024-03", 0, "2024-03"),
    ],
)
def test_shift_competencia_handles_year_rollover(competencia, months, expected):
    assert shift_competencia(competencia, months) == expected


def test_windows_cover_three_recent_and_twelve_base_months():
    windows = build_windows("2026-01")

    assert windows.inicio_recente == "2025-11"
    assert windows.inicio_base == "2024-11"


@pytest.mark.parametrize("dialect", [sqlite.dialect(), postgresql.dialect(), mysql.dialect()])
def test_suspicious_query_compiles_without_vendor_specific_functions(dialect):
    query = suspicious_profiles_query(build_windows("2026-01"), SuspicionFilters(limiar_queda=0.5))

    compiled_sql = str(query.compile(dialect=dialect)).lower()

    assert "strftime" not in compiled_sql
    assert "fato_medicao" in compiled_sql


def test_optional_filters_only_added_when_informed():
    windows = build_windows("2026-01")

    without_filters = str(suspicious_profiles_query(windows, SuspicionFilters(limiar_queda=0.5)))
    with_filters = str(suspicious_profiles_query(windows, SuspicionFilters(limiar_queda=0.5, municipio="Recife")))

    assert "dim_unidade_consumidora.municipio =" not in without_filters
    assert "dim_unidade_consumidora.municipio =" in with_filters


def test_bairro_filter_only_added_when_informed():
    windows = build_windows("2026-01")

    without_filters = str(suspicious_profiles_query(windows, SuspicionFilters(limiar_queda=0.5)))
    with_filters = str(suspicious_profiles_query(windows, SuspicionFilters(limiar_queda=0.5, bairro="Boa Viagem")))

    assert "dim_unidade_consumidora.bairro =" not in without_filters
    assert "dim_unidade_consumidora.bairro =" in with_filters


def test_inspection_cutoff_is_first_day_of_analysis_window():
    assert inspection_cutoff_date(build_windows("2026-01")).isoformat() == "2024-11-01"


def test_queue_query_excludes_historical_inspections():
    query = suspicious_profiles_query(build_windows("2026-01"), SuspicionFilters(limiar_queda=0.5))

    assert "fato_inspecoes_perdas" in str(query)


def test_queue_query_can_skip_historical_inspections_table():
    filters = SuspicionFilters(limiar_queda=0.5)

    query = suspicious_profiles_query(build_windows("2026-01"), filters, include_field_history=False)

    assert "fato_inspecoes_perdas" not in str(query)
    assert "ordem_inspecao" in str(query)


GOLD_FIXTURE_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC1', 'Recife', 'Centro', 'Residencial', 0)",
    "INSERT INTO fato_medicao VALUES ('UC1', '2025-06', 300), ('UC1', '2026-01', 0)",
    "INSERT INTO fato_inspecoes_perdas VALUES (NULL, '2025-12-01')",
)


NEGATIVE_READING_FIXTURE_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_ESTAVEL', 'Recife', 'Centro', 'Residencial', 0)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_QUEDA_REAL', 'Recife', 'Centro', 'Residencial', 0)",
    (
        "INSERT INTO fato_medicao VALUES "
        "('UC_ESTAVEL', '2025-06', 300), ('UC_ESTAVEL', '2025-11', 300), "
        "('UC_ESTAVEL', '2025-12', 300), ('UC_ESTAVEL', '2026-01', -900)"
    ),
    (
        "INSERT INTO fato_medicao VALUES "
        "('UC_QUEDA_REAL', '2025-06', 300), ('UC_QUEDA_REAL', '2025-11', 100), "
        "('UC_QUEDA_REAL', '2025-12', 100), ('UC_QUEDA_REAL', '2026-01', 100)"
    ),
)


def test_negative_readings_do_not_create_a_false_sudden_drop():
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in NEGATIVE_READING_FIXTURE_STATEMENTS:
            connection.execute(text(ddl_statement))
        query = suspicious_profiles_query(build_windows("2026-01"), SuspicionFilters(limiar_queda=0.5))

        candidate_ids = [row.id_uc for row in connection.execute(query)]

    assert candidate_ids == ["UC_QUEDA_REAL"]


def test_without_a_fixed_reference_the_latest_competencia_is_used_and_history_is_unbounded():
    reference = resolve_analysis_reference("2026-06", None)

    assert (reference.competencia, reference.history_until) == ("2026-06", None)


def test_fixed_reference_in_the_past_limits_the_history_to_its_month():
    reference = resolve_analysis_reference("2026-06", "2025-08")

    assert (reference.competencia, reference.history_until) == ("2025-08", date(2025, 9, 1))


def test_fixed_reference_in_december_limits_the_history_to_the_year_end():
    assert resolve_analysis_reference("2026-06", "2025-12").history_until == date(2026, 1, 1)


@pytest.mark.parametrize("fixed_competencia", ["2026-06", "2027-01"])
def test_fixed_reference_not_before_the_latest_data_is_live_mode(fixed_competencia):
    reference = resolve_analysis_reference("2026-06", fixed_competencia)

    assert (reference.competencia, reference.history_until) == ("2026-06", None)


HISTORY_BOUND_FIXTURE_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_ANTES', 'Recife', 'Centro', 'Residencial', 0)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_DEPOIS', 'Recife', 'Centro', 'Residencial', 0)",
    (
        "INSERT INTO fato_medicao VALUES "
        "('UC_ANTES', '2025-01', 300), ('UC_ANTES', '2025-06', 100), ('UC_ANTES', '2025-07', 100), "
        "('UC_ANTES', '2025-08', 100), ('UC_DEPOIS', '2025-01', 300), ('UC_DEPOIS', '2025-06', 100), "
        "('UC_DEPOIS', '2025-07', 100), ('UC_DEPOIS', '2025-08', 100)"
    ),
    "INSERT INTO fato_inspecoes_perdas VALUES ('UC_ANTES', '2025-08-15'), ('UC_DEPOIS', '2025-11-10')",
)


def queue_ids_as_of_august_2025(history_until):
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in HISTORY_BOUND_FIXTURE_STATEMENTS:
            connection.execute(text(ddl_statement))
        query = suspicious_profiles_query(
            build_windows("2025-08"), SuspicionFilters(limiar_queda=0.5), history_until=history_until
        )
        return sorted(row.id_uc for row in connection.execute(query))


def test_history_bound_ignores_inspections_that_had_not_happened_yet():
    assert queue_ids_as_of_august_2025(date(2025, 9, 1)) == ["UC_DEPOIS"]


def test_without_history_bound_a_later_inspection_still_excludes_the_unit():
    assert queue_ids_as_of_august_2025(None) == []


def test_null_id_in_historical_inspections_does_not_empty_the_queue():
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in GOLD_FIXTURE_STATEMENTS:
            connection.execute(text(ddl_statement))
        query = suspicious_profiles_query(build_windows("2026-01"), SuspicionFilters(limiar_queda=0.5))

        candidate_ids = [row.id_uc for row in connection.execute(query)]

    assert candidate_ids == ["UC1"]
