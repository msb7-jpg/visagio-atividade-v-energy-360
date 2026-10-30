import sqlite3
from contextlib import closing

from sqlalchemy.dialects import sqlite

from app.features.executive_dashboard.queries import service_query
from app.features.revenue.schemas import PeriodWindow

BASE = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")


def test_service_query_uses_iso_date_ranges_with_exclusive_next_month_bounds():
    compiled = service_query(BASE, CURRENT).compile(dialect=sqlite.dialect())
    sql = str(compiled)

    assert "substr(" not in sql
    assert "fato_atendimentos.data_abertura >= ?" in sql
    assert "fato_atendimentos.data_abertura < ?" in sql
    assert {"2022-07-01", "2023-07-01", "2025-07-01", "2026-07-01"} <= set(compiled.params.values())


def test_service_query_includes_both_window_boundaries_and_excludes_adjacent_months():
    with closing(sqlite3.connect(":memory:")) as connection:
        connection.execute(
            "CREATE TABLE fato_atendimentos "
            "(data_abertura TEXT, nota_csat REAL, tempo_resolucao_horas REAL)"
        )
        connection.executemany(
            "INSERT INTO fato_atendimentos VALUES (?, ?, ?)",
            [
                ("2022-06-30 23:59:59", 1.0, 10.0),
                ("2022-07-01 00:00:00", 3.0, 20.0),
                ("2023-06-30 23:59:59", 5.0, 30.0),
                ("2023-07-01 00:00:00", 1.0, 10.0),
                ("2025-07-01 00:00:00", 2.0, 40.0),
                ("2026-06-30 23:59:59", 4.0, 60.0),
                ("2026-07-01 00:00:00", 1.0, 10.0),
            ],
        )
        compiled = service_query(BASE, CURRENT).compile(dialect=sqlite.dialect())
        bind_values = tuple(compiled.params[key] for key in compiled.positiontup or ())
        result = connection.execute(str(compiled), bind_values).fetchone()

    assert result == (4.0, 3.0, 25.0, 50.0)
