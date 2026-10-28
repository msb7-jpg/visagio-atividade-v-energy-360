"""Seed das tabelas Gold lidas pelo Painel do Diretor, com o esquema exportado pelas Fatias 01 e 02.

Cenário com números redondos nas janelas padrão (base 2022-07 a 2023-06, atual 2025-07 a 2026-06):
- UC300001 e UC300002 faturam nas duas janelas; UC300003 só na atual e liga o painel solar em 2025-09.
- UC300002 tem queda forte de consumo nos últimos 3 meses e entra na Fila de Perdas.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.features.executive_dashboard.cache import dashboard_cache
from app.features.loss_management.models import InspectionOrder
from app.main import app
from tests.revenue_seed import JANELA_ATUAL, JANELA_BASE

CREATE_TABLES = {
    "dim_unidade_consumidora": (
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, codigo_cliente TEXT, nome_titular TEXT, "
        "logradouro TEXT, numero TEXT, bairro TEXT, municipio TEXT, uf TEXT, cep TEXT, classe_consumo TEXT, "
        "subgrupo_tarifario TEXT, alimentador TEXT, subestacao TEXT, numero_medidor_ativo TEXT, possui_gd BOOLEAN, "
        "potencia_gd_kw REAL, data_conexao_gd TEXT, status TEXT)"
    ),
    "fato_medicao": (
        "CREATE TABLE fato_medicao (id_medicao TEXT PRIMARY KEY, id_uc TEXT NOT NULL, id_medidor TEXT, "
        "competencia TEXT NOT NULL, data_leitura TEXT, leitura_anterior REAL, leitura_atual REAL, consumo_kwh REAL, "
        "dias_faturamento INTEGER, media_diaria_kwh REAL, tipo_leitura TEXT)"
    ),
    "fato_faturamento": (
        "CREATE TABLE fato_faturamento (id_fatura TEXT PRIMARY KEY, id_uc TEXT NOT NULL, competencia TEXT NOT NULL, "
        "valor_energia_rs REAL, tributos_rs REAL, valor_total_rs REAL, consumo_faturado_kwh REAL, "
        "bandeira_tarifaria TEXT, tarifa_aplicada_rs_kwh REAL, data_emissao TEXT, data_vencimento TEXT, "
        "data_pagamento TEXT, status_pagamento TEXT)"
    ),
    "fato_ocorrencias_rede": (
        "CREATE TABLE fato_ocorrencias_rede (id_ocorrencia TEXT PRIMARY KEY, id_uc TEXT NOT NULL, "
        "id_alimentador TEXT NOT NULL, tipo_ocorrencia TEXT, causa TEXT, inicio_interrupcao TEXT, "
        "fim_interrupcao TEXT, duracao_min INTEGER, duracao_horas REAL, competencia TEXT, "
        "fl_anterior_ligacao BOOLEAN)"
    ),
    "fato_atendimentos": (
        "CREATE TABLE fato_atendimentos (id_atendimento TEXT PRIMARY KEY, id_uc TEXT, numero_protocolo TEXT, "
        "motivo_chamado TEXT, submotivo_chamado TEXT, canal_atendimento TEXT, data_abertura TEXT, "
        "data_fechamento TEXT, status_chamado TEXT, tempo_resolucao_horas REAL, qtd_tratativas INTEGER, "
        "nota_csat REAL)"
    ),
    "fato_inspecoes_perdas": (
        "CREATE TABLE fato_inspecoes_perdas (id_inspecao TEXT PRIMARY KEY, id_uc TEXT, data_inspecao TEXT, "
        "id_inspetor TEXT, irregularidade_constatada BOOLEAN, tipo_irregularidade TEXT, kwh_recuperado REAL)"
    ),
}

# (id_uc, data_conexao_gd, (kWh, R$) por mês na janela base, (kWh, R$) por mês na janela atual)
UNITS = (
    ("UC300001", None, (100.0, 80.0), (90.0, 81.0)),
    ("UC300002", None, (100.0, 80.0), (90.0, 81.0)),
    ("UC300003", "2025-09-10", None, (100.0, 90.0)),
)
OVERDUE_INVOICES = {("UC300001", "2022-07"), ("UC300003", "2025-07"), ("UC300003", "2025-08")}
ESTIMATED_READINGS = {("UC300001", competencia) for competencia in JANELA_BASE[:6]} | {
    ("UC300003", competencia) for competencia in JANELA_ATUAL[:3]
}
LOSS_DROP_MONTHS = set(JANELA_ATUAL[-3:])

# (competência, quantidade de linhas, horas de cada interrupção)
OUTAGES = (("2022-10", 4, 2.0), ("2025-07", 6, 3.0))
# (data de abertura, nota, horas até resolver)
SERVICE_CALLS = (
    ("2022-08-05 10:00:00", 4.0, 10.0),
    ("2023-02-11 09:00:00", 4.0, 20.0),
    ("2025-09-01 08:00:00", 3.0, 30.0),
    ("2026-01-15 14:00:00", 4.0, 30.0),
    ("2026-05-20 16:00:00", None, 30.0),
)
FIELD_INSPECTIONS = (("INS-1", "UC300001", "2025-09-10", True), ("INS-2", "UC300001", "2025-10-02", False))


def unit_rows() -> list[dict[str, object]]:
    return [
        {"id_uc": id_uc, "bairro": "BOA VIAGEM", "municipio": "RECIFE", "classe_consumo": "Residencial",
         "possui_gd": data_conexao_gd is not None, "data_conexao_gd": data_conexao_gd}
        for id_uc, data_conexao_gd, _, _ in UNITS
    ]


def monthly_rows() -> list[tuple[str, str, float, float]]:
    """(id_uc, competência, kWh, R$) de cada fatura da seed."""
    rows = []
    for id_uc, _, base_month, current_month in UNITS:
        for window, month_values in ((JANELA_BASE, base_month), (JANELA_ATUAL, current_month)):
            if month_values is not None:
                rows.extend((id_uc, competencia, *month_values) for competencia in window)
    return rows


def invoice_rows() -> list[dict[str, object]]:
    return [
        {"id_fatura": f"FT-{id_uc}-{competencia}", "id_uc": id_uc, "competencia": competencia, "kwh": kwh,
         "valor": valor, "status": "VENCIDA" if (id_uc, competencia) in OVERDUE_INVOICES else "PAGA"}
        for id_uc, competencia, kwh, valor in monthly_rows()
    ]


def measurement_rows() -> list[dict[str, object]]:
    return [
        {"id_medicao": f"MD-{id_uc}-{competencia}", "id_uc": id_uc, "competencia": competencia,
         "consumo": 20.0 if id_uc == "UC300002" and competencia in LOSS_DROP_MONTHS else kwh,
         "tipo": "ESTIMADA" if (id_uc, competencia) in ESTIMATED_READINGS else "REAL"}
        for id_uc, competencia, kwh, _ in monthly_rows()
    ]


def outage_rows() -> list[dict[str, object]]:
    return [
        {"id_ocorrencia": f"OC-{competencia}-{position}", "id_uc": "UC300001", "competencia": competencia,
         "horas": horas}
        for competencia, quantity, horas in OUTAGES
        for position in range(quantity)
    ]


def inspection_rows() -> list[dict[str, object]]:
    return [
        {"id_inspecao": id_inspecao, "id_uc": id_uc, "data_inspecao": data_inspecao, "confirmada": confirmada}
        for id_inspecao, id_uc, data_inspecao, confirmada in FIELD_INSPECTIONS
    ]


def service_rows() -> list[dict[str, object]]:
    return [
        {"id_atendimento": f"AT-{position}", "data_abertura": opened_at, "nota": nota, "horas": horas}
        for position, (opened_at, nota, horas) in enumerate(SERVICE_CALLS)
    ]


INSERTS = (
    (
        "dim_unidade_consumidora",
        (
            "INSERT INTO dim_unidade_consumidora (id_uc, bairro, municipio, classe_consumo, possui_gd, "
            "data_conexao_gd) VALUES (:id_uc, :bairro, :municipio, :classe_consumo, :possui_gd, :data_conexao_gd)"
        ),
        unit_rows,
    ),
    (
        "fato_faturamento",
        (
            "INSERT INTO fato_faturamento (id_fatura, id_uc, competencia, valor_total_rs, consumo_faturado_kwh, "
            "status_pagamento) VALUES (:id_fatura, :id_uc, :competencia, :valor, :kwh, :status)"
        ),
        invoice_rows,
    ),
    (
        "fato_medicao",
        (
            "INSERT INTO fato_medicao (id_medicao, id_uc, competencia, consumo_kwh, tipo_leitura) "
            "VALUES (:id_medicao, :id_uc, :competencia, :consumo, :tipo)"
        ),
        measurement_rows,
    ),
    (
        "fato_ocorrencias_rede",
        (
            "INSERT INTO fato_ocorrencias_rede (id_ocorrencia, id_uc, id_alimentador, competencia, duracao_horas, "
            "fl_anterior_ligacao) VALUES (:id_ocorrencia, :id_uc, 'ALM-REC-001', :competencia, :horas, 0)"
        ),
        outage_rows,
    ),
    (
        "fato_atendimentos",
        (
            "INSERT INTO fato_atendimentos (id_atendimento, id_uc, data_abertura, nota_csat, tempo_resolucao_horas) "
            "VALUES (:id_atendimento, 'UC300001', :data_abertura, :nota, :horas)"
        ),
        service_rows,
    ),
    (
        "fato_inspecoes_perdas",
        (
            "INSERT INTO fato_inspecoes_perdas (id_inspecao, id_uc, data_inspecao, irregularidade_constatada) "
            "VALUES (:id_inspecao, :id_uc, :data_inspecao, :confirmada)"
        ),
        inspection_rows,
    ),
)


async def seed_dashboard_tables(connection: AsyncConnection, *, skip_table: str | None = None) -> None:
    """Cria e popula as tabelas Gold do Painel; `skip_table` deixa uma tabela de fora (teste de erro)."""
    await connection.run_sync(InspectionOrder.metadata.create_all)
    for table_name, create_statement in CREATE_TABLES.items():
        if table_name != skip_table:
            await connection.execute(text(create_statement))
    for table_name, insert_statement, build_rows in INSERTS:
        if table_name != skip_table:
            await connection.execute(text(insert_statement), build_rows())


@asynccontextmanager
async def seeded_client(*, skip_table: str | None = None) -> AsyncGenerator[AsyncClient]:
    """Cliente HTTP com o `get_db` apontando para um SQLite em memória populado pela seed."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    dashboard_cache.clear()
    try:
        async with engine.begin() as connection:
            await seed_dashboard_tables(connection, skip_table=skip_table)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        async def override_get_db():
            async with session_factory() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http_client:
            yield http_client
    finally:
        app.dependency_overrides.clear()
        dashboard_cache.clear()
        await engine.dispose()
