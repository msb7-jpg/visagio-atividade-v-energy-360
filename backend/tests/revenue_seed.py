from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass
 
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
 
from app.db.session import get_db
from app.main import app
 
 
def twelve_months(first_year: int) -> tuple[str, ...]:
    """12 competências consecutivas, de julho de `first_year` a junho do ano seguinte."""
    second_half = tuple(f"{first_year}-{month:02d}" for month in range(7, 13))
    first_half = tuple(f"{first_year + 1}-{month:02d}" for month in range(1, 7))
    return second_half + first_half
 
 
# Janelas padrão do case: primeiro ano da base e últimos 12 meses.
JANELA_BASE = twelve_months(2022)
JANELA_ATUAL = twelve_months(2025)
 
CREATE_TABLES = (
    (
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, codigo_cliente TEXT, classe_consumo TEXT, "
        "subgrupo_tarifario TEXT, municipio TEXT, bairro TEXT, alimentador TEXT, subestacao TEXT, "
        "numero_medidor_ativo TEXT, possui_gd BOOLEAN, potencia_gd_kw REAL)"
    ),
    (
        "CREATE TABLE fato_faturamento (id_fatura TEXT PRIMARY KEY, id_uc TEXT, competencia TEXT, valor_total_rs REAL, "
        "consumo_faturado_kwh REAL, bandeira_tarifaria TEXT, tarifa_aplicada_rs_kwh REAL, data_vencimento TEXT, "
        "data_pagamento TEXT, status_pagamento TEXT)"
    ),
)
 
INSERT_UNIT = (
    "INSERT INTO dim_unidade_consumidora (id_uc, codigo_cliente, classe_consumo, subgrupo_tarifario, municipio, "
    "bairro, alimentador, subestacao, numero_medidor_ativo, possui_gd, potencia_gd_kw) VALUES (:id_uc, "
    ":codigo_cliente, :classe_consumo, :subgrupo_tarifario, :municipio, :bairro, :alimentador, :subestacao, "
    ":numero_medidor_ativo, :possui_gd, :potencia_gd_kw)"
)
 
INSERT_INVOICE = (
    "INSERT INTO fato_faturamento (id_fatura, id_uc, competencia, valor_total_rs, consumo_faturado_kwh, "
    "bandeira_tarifaria, tarifa_aplicada_rs_kwh, data_vencimento, data_pagamento, status_pagamento) VALUES "
    "(:id_fatura, :id_uc, :competencia, :valor_total_rs, :consumo_faturado_kwh, :bandeira_tarifaria, "
    ":tarifa_aplicada_rs_kwh, :data_vencimento, :data_pagamento, :status_pagamento)"
)
 
 
@dataclass(frozen=True)
class SeedUnit:
    """Cenário de UC: consumo e tarifa constantes em cada janela de 12 meses."""
 
    id_uc: str
    classe_consumo: str
    subgrupo_tarifario: str
    municipio: str
    bairro: str
    kwh_mensal_base: float
    tarifa_base: float
    kwh_mensal_atual: float
    tarifa_atual: float
 
 
UNIDADES = (
    # Exemplo-ouro: por mês 800 vira 792 (preço +80, volume -80, cruzado -8); na janela de 12 meses, 9600 vira 9504.
    SeedUnit("UC200001", "Residencial", "B1", "RECIFE", "BOA VIAGEM", 1000.0, 0.80, 900.0, 0.88),
    SeedUnit("UC200002", "Residencial", "B1", "RECIFE", "BOA VIAGEM", 500.0, 0.80, 500.0, 0.88),  # só preço
    SeedUnit("UC200003", "Comercial", "B3", "RECIFE", "CASA AMARELA", 2000.0, 0.70, 1500.0, 0.70),  # só volume cai
    SeedUnit("UC200004", "Industrial", "A4", "JABOATAO DOS GUARARAPES", "PIEDADE", 5000.0, 0.50, 5000.0, 0.50),
    SeedUnit("UC200005", "Residencial", "B1", "OLINDA", "VARADOURO", 400.0, 0.80, 480.0, 0.88),  # volume sobe
)
 
 
def unit_rows() -> list[dict[str, object]]:
    return [
        {
            "id_uc": unit.id_uc, "codigo_cliente": f"CLI{unit.id_uc[2:]}", "classe_consumo": unit.classe_consumo,
            "subgrupo_tarifario": unit.subgrupo_tarifario, "municipio": unit.municipio, "bairro": unit.bairro,
            "alimentador": "ALM-REC-001", "subestacao": None, "numero_medidor_ativo": f"MD{unit.id_uc[2:]}",
            "possui_gd": False, "potencia_gd_kw": 0.0,
        }
        for unit in UNIDADES
    ]
 
 
def billing_months(unit: SeedUnit) -> list[tuple[str, float, float]]:
    """Pares (competência, kWh, tarifa) das duas janelas da UC."""
    base_window = [(month, unit.kwh_mensal_base, unit.tarifa_base) for month in JANELA_BASE]
    current_window = [(month, unit.kwh_mensal_atual, unit.tarifa_atual) for month in JANELA_ATUAL]
    return base_window + current_window
 
 
def invoice_rows() -> list[dict[str, object]]:
    return [
        {
            "id_fatura": f"FT-{unit.id_uc}-{competencia}", "id_uc": unit.id_uc, "competencia": competencia,
            "valor_total_rs": round(kwh * tariff, 2), "consumo_faturado_kwh": kwh, "bandeira_tarifaria": "VERDE",
            "tarifa_aplicada_rs_kwh": tariff, "data_vencimento": f"{competencia}-20",
            "data_pagamento": f"{competencia}-18", "status_pagamento": "PAGA",
        }
        for unit in UNIDADES
        for competencia, kwh, tariff in billing_months(unit)
    ]
 
 
async def seed_revenue_tables(connection: AsyncConnection) -> None:
    """Cria e popula as tabelas Gold usadas pela Receita numa conexão assíncrona (testes)."""
    for create_statement in CREATE_TABLES:
        await connection.execute(text(create_statement))
    await connection.execute(text(INSERT_UNIT), unit_rows())
    await connection.execute(text(INSERT_INVOICE), invoice_rows())
 
 
@asynccontextmanager
async def seeded_engine() -> AsyncGenerator[AsyncEngine]:
    """Engine de um SQLite em memória já populado pela seed."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with engine.begin() as connection:
            await seed_revenue_tables(connection)
        yield engine
    finally:
        await engine.dispose()
 
 
@asynccontextmanager
async def seeded_client() -> AsyncGenerator[AsyncClient]:
    """Cliente HTTP com o `get_db` apontando para o SQLite em memória populado pela seed."""
    async with seeded_engine() as engine:
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
 
        async def override_get_db():
            async with session_factory() as session:
                yield session
 
        app.dependency_overrides[get_db] = override_get_db
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http_client:
                yield http_client
        finally:
            app.dependency_overrides.clear()