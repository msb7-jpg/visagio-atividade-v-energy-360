from sqlalchemy.dialects import postgresql, sqlite

from app.features.revenue.queries import period_totals_query, segment_totals_query
from app.features.revenue.schemas import PeriodWindow, RevenueFilters

BASE = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")
QUERIES = (segment_totals_query, period_totals_query)


def compile_to(query, dialect):
    return query.compile(dialect=dialect)


def test_queries_without_filters_have_no_filter_parameters():
    for build_query in QUERIES:
        compiled = compile_to(build_query(BASE, CURRENT, RevenueFilters()), postgresql.dialect())

        assert not {"municipio_1", "bairro_1", "classe_consumo_1"} & set(compiled.params)
        assert "IS NULL" not in str(compiled)


def test_queries_apply_only_the_filters_that_were_given():
    filters = RevenueFilters(bairro="BOA VIAGEM")

    for build_query in QUERIES:
        compiled = compile_to(build_query(BASE, CURRENT, filters), sqlite.dialect())

        assert "BOA VIAGEM" in compiled.params.values()
        assert "dim_unidade_consumidora.bairro = ?" in str(compiled)
        assert "dim_unidade_consumidora.municipio = ?" not in str(compiled)