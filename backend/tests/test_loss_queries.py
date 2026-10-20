import pytest
from sqlalchemy.dialects import mysql, postgresql, sqlite

from app.features.loss_management.queries import (
    SuspicionFilters,
    build_windows,
    shift_competencia,
    suspicious_profiles_query,
)


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
