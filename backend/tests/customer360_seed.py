"""Seed das tabelas Gold usadas pela Visão 360, no formato documentado pelas Fatias 01 e 02.

Uso nos testes: `await seed_customer360_tables(connection)` numa conexão SQLAlchemy assíncrona.
Uso no desenvolvimento: `uv run python -m tests.customer360_seed` gera `v_energy_dev.db`
(aponte a API para ele com `DATABASE_URL=sqlite+aiosqlite:///./v_energy_dev.db`).
"""

import sqlite3
import sys
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.features.customer360.consumption_analysis import shift_competencia

ULTIMA_COMPETENCIA = "2026-06"
MESES_HISTORICO = 24
TARIFA_ANO_ANTERIOR = 0.80
TARIFA_ANO_RECENTE = 0.88
ADICIONAL_BANDEIRA = {"VERDE": 0.0, "AMARELA": 0.02, "VERMELHA_P1": 0.05, "VERMELHA_P2": 0.09}

CREATE_TABLES = (
    (
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, codigo_cliente TEXT, classe_consumo TEXT, "
        "subgrupo_tarifario TEXT, municipio TEXT, bairro TEXT, alimentador TEXT, subestacao TEXT, "
        "numero_medidor_ativo TEXT, possui_gd BOOLEAN, potencia_gd_kw REAL)"
    ),
    (
        "CREATE TABLE fato_medicao (id_medicao TEXT PRIMARY KEY, id_uc TEXT, competencia TEXT, "
        "leitura_anterior REAL, leitura_atual REAL, consumo_kwh REAL, dias_faturamento INT)"
    ),
    (
        "CREATE TABLE fato_faturamento (id_fatura TEXT PRIMARY KEY, id_uc TEXT, competencia TEXT, valor_total_rs REAL, "
        "consumo_faturado_kwh REAL, bandeira_tarifaria TEXT, tarifa_aplicada_rs_kwh REAL, data_vencimento TEXT, "
        "data_pagamento TEXT, status_pagamento TEXT)"
    ),
    (
        "CREATE TABLE fato_qualidade_alimentador (id_alimentador TEXT, competencia TEXT, dec_apurado_horas REAL, "
        "fec_apurado_vezes REAL, dec_limite_aneel REAL, fec_limite_aneel REAL, violou_meta BOOLEAN, "
        "PRIMARY KEY (id_alimentador, competencia))"
    ),
    (
        "CREATE TABLE fato_atendimentos (id_atendimento TEXT PRIMARY KEY, id_uc TEXT, numero_protocolo TEXT, "
        "motivo_chamado TEXT, data_abertura TEXT, status_chamado TEXT, nota_csat INT)"
    ),
)


@dataclass(frozen=True)
class SeedUnit:
    """Cenário de UC: consumo constante no ano anterior e no ano recente (últimos 12 meses)."""

    id_uc: str
    alimentador: str
    possui_gd: bool
    potencia_gd_kw: float
    kwh_ano_anterior: float
    kwh_ano_recente: float
    meses_historico: int = MESES_HISTORICO


SEED_UNITS = (
    SeedUnit("UC100001", "ALM-REC-004", False, 0.0, 200.0, 205.0),
    SeedUnit("UC100002", "ALM-REC-004", True, 4.5, 300.0, 150.0),
    SeedUnit("UC100003", "ALM-REC-004", False, 0.0, 200.0, 280.0),
    SeedUnit("UC100004", "ALM-REC-004", False, 0.0, 200.0, 200.0),
    SeedUnit("UC100005", "ALM-OLI-002", False, 0.0, 150.0, 150.0, meses_historico=6),
    SeedUnit("UC100006", "ALM-REC-004", False, 0.0, 200.0, 200.0),
)

DIAS_PADRAO = 30
MEASUREMENT_OVERRIDES = {
    ("UC100006", "2026-06"): (240.0, 36),
}

INVOICE_OVERRIDES = {
    ("UC100004", "2026-06"): ("VERMELHA_P2", "ABERTA"),
    ("UC100004", "2026-05"): ("VERMELHA_P1", "VENCIDA"),
    ("UC100003", "2026-06"): ("VERDE", "ABERTA"),
}

PAYMENT_DATE_OVERRIDES = {
    ("UC100004", "2026-04"): "2026-04-27",
    ("UC100004", "2026-03"): "2026-03-25",
}

SERVICE_TICKETS = (
    ("AT000000001", "UC100001", "PRT-2026-0001", "FALTA DE ENERGIA", "2026-03-12 10:00:00", "ENCERRADO", 8),
    ("AT000000002", "UC100001", "PRT-2026-0002", "FATURA", "2026-05-02 14:30:00", "EM ANDAMENTO", None),
    ("AT000000003", "UC100004", "PRT-2026-0003", "FATURA", "2026-06-25 09:15:00", "ABERTO", None),
)


def history_months(unit: SeedUnit) -> list[str]:
    return [shift_competencia(ULTIMA_COMPETENCIA, -offset) for offset in reversed(range(unit.meses_historico))]


def monthly_days(unit: SeedUnit, competencia: str) -> int:
    override = MEASUREMENT_OVERRIDES.get((unit.id_uc, competencia))
    return override[1] if override else DIAS_PADRAO


def monthly_kwh(unit: SeedUnit, competencia: str) -> float:
    override = MEASUREMENT_OVERRIDES.get((unit.id_uc, competencia))
    if override:
        return override[0]
    recent_year_start = shift_competencia(ULTIMA_COMPETENCIA, -11)
    return unit.kwh_ano_recente if competencia >= recent_year_start else unit.kwh_ano_anterior


def unit_rows() -> list[dict[str, object]]:
    return [
        {
            "id_uc": unit.id_uc, "codigo_cliente": f"CLI{unit.id_uc[2:]}", "classe_consumo": "Residencial",
            "subgrupo_tarifario": "B1", "municipio": "Recife", "bairro": "Arruda", "alimentador": unit.alimentador,
            "subestacao": None, "numero_medidor_ativo": f"MD5{unit.id_uc[3:]}", "possui_gd": unit.possui_gd,
            "potencia_gd_kw": unit.potencia_gd_kw,
        }
        for unit in SEED_UNITS
    ]


def measurement_rows() -> list[dict[str, object]]:
    rows = []
    for unit in SEED_UNITS:
        accumulated_reading = 10_000.0
        for competencia in history_months(unit):
            consumption = monthly_kwh(unit, competencia)
            rows.append({
                "id_medicao": f"LT-{unit.id_uc}-{competencia}", "id_uc": unit.id_uc, "competencia": competencia,
                "leitura_anterior": accumulated_reading, "leitura_atual": accumulated_reading + consumption,
                "consumo_kwh": consumption, "dias_faturamento": monthly_days(unit, competencia),
            })
            accumulated_reading += consumption
    return rows


def invoice_rows() -> list[dict[str, object]]:
    recent_year_start = shift_competencia(ULTIMA_COMPETENCIA, -11)
    rows = []
    for unit in SEED_UNITS:
        for competencia in history_months(unit):
            flag, status = INVOICE_OVERRIDES.get((unit.id_uc, competencia), ("VERDE", "PAGA"))
            base_tariff = TARIFA_ANO_RECENTE if competencia >= recent_year_start else TARIFA_ANO_ANTERIOR
            tariff = base_tariff + ADICIONAL_BANDEIRA[flag]
            consumption = monthly_kwh(unit, competencia)
            rows.append({
                "id_fatura": f"FT-{unit.id_uc}-{competencia}", "id_uc": unit.id_uc, "competencia": competencia,
                "valor_total_rs": round(consumption * tariff, 2), "consumo_faturado_kwh": consumption,
                "bandeira_tarifaria": flag, "tarifa_aplicada_rs_kwh": round(tariff, 4),
                "data_vencimento": f"{competencia}-20",
                "data_pagamento": PAYMENT_DATE_OVERRIDES.get((unit.id_uc, competencia), f"{competencia}-18")
                if status == "PAGA" else None,
                "status_pagamento": status,
            })
    return rows


def feeder_quality_rows() -> list[dict[str, object]]:
    rows = []
    for offset in range(MESES_HISTORICO):
        competencia = shift_competencia(ULTIMA_COMPETENCIA, -offset)
        violated = competencia == "2026-03"
        rows.append({
            "id_alimentador": "ALM-REC-004", "competencia": competencia,
            "dec_apurado_horas": 4.2 if violated else 1.5, "fec_apurado_vezes": 3.0 if violated else 1.0,
            "dec_limite_aneel": 2.5, "fec_limite_aneel": 2.0, "violou_meta": violated,
        })
    return rows


def ticket_rows() -> list[dict[str, object]]:
    columns = ("id_atendimento", "id_uc", "numero_protocolo", "motivo_chamado", "data_abertura", "status_chamado",
               "nota_csat")
    return [dict(zip(columns, ticket, strict=True)) for ticket in SERVICE_TICKETS]


def insert_statements() -> list[tuple[str, list[dict[str, object]]]]:
    tables = {
        "dim_unidade_consumidora": unit_rows(),
        "fato_medicao": measurement_rows(),
        "fato_faturamento": invoice_rows(),
        "fato_qualidade_alimentador": feeder_quality_rows(),
        "fato_atendimentos": ticket_rows(),
    }
    statements = []
    for table_name, rows in tables.items():
        columns = list(rows[0])
        placeholders = ", ".join(f":{column}" for column in columns)
        insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"  # ruff: ignore[hardcoded-sql-expression]
        statements.append((insert_sql, rows))
    return statements


async def seed_customer360_tables(connection: AsyncConnection) -> None:
    """Cria e popula as tabelas Gold da Visão 360 numa conexão assíncrona (testes)."""
    for create_statement in CREATE_TABLES:
        await connection.execute(text(create_statement))
    for insert_sql, rows in insert_statements():
        await connection.execute(text(insert_sql), rows)


def write_dev_database(db_path: Path) -> None:
    """Gera um arquivo SQLite de desenvolvimento com os cenários da seed (nunca o v_energy.db real)."""
    db_path.unlink(missing_ok=True)
    with closing(sqlite3.connect(db_path)) as connection, connection:
        for create_statement in CREATE_TABLES:
            connection.execute(create_statement)
        for insert_sql, rows in insert_statements():
            connection.executemany(insert_sql, rows)


if __name__ == "__main__":
    target_path = Path(sys.argv[1] if len(sys.argv) > 1 else "v_energy_dev.db")
    if target_path.name == "v_energy.db":
        sys.exit("Recusado: a seed não sobrescreve o banco real v_energy.db.")
    write_dev_database(target_path)
    sys.stdout.write(f"Banco de desenvolvimento gerado em {target_path.resolve()}\n")
