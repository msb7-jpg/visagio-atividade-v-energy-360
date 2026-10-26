import pytest
from sqlalchemy import text
 
from app.db.session import get_db
from app.main import app
from tests.revenue_seed import JANELA_ATUAL, JANELA_BASE, UNIDADES, seeded_client, seeded_engine
 
COUNT_INVOICES = "SELECT COUNT(*) FROM fato_faturamento"
COUNT_UNITS = "SELECT COUNT(*) FROM dim_unidade_consumidora"
SUM_REVENUE = (
    "SELECT SUM(valor_total_rs) FROM fato_faturamento "
    "WHERE id_uc = :id_uc AND competencia BETWEEN :first_month AND :last_month"
)
 
 
async def revenue_of_window(connection, id_uc: str, window: tuple[str, ...]) -> float:
    result = await connection.execute(
        text(SUM_REVENUE), {"id_uc": id_uc, "first_month": window[0], "last_month": window[-1]}
    )
    return result.scalar_one()

 
async def test_seed_has_two_windows_of_invoices_per_unit():
    async with seeded_engine() as engine, engine.connect() as connection:
        units = (await connection.execute(text(COUNT_UNITS))).scalar_one()
        invoices = (await connection.execute(text(COUNT_INVOICES))).scalar_one()
 
    assert units == len(UNIDADES)
    assert invoices == len(UNIDADES) * (len(JANELA_BASE) + len(JANELA_ATUAL))
 
 
async def test_golden_example_scales_to_twelve_months():
    async with seeded_engine() as engine, engine.connect() as connection:
        base_revenue = await revenue_of_window(connection, "UC200001", JANELA_BASE)
        current_revenue = await revenue_of_window(connection, "UC200001", JANELA_ATUAL)
 
    assert base_revenue == pytest.approx(9600.0)
    assert current_revenue == pytest.approx(9504.0)
 
 
async def test_seeded_client_overrides_database_and_cleans_up():
    async with seeded_client():
        assert get_db in app.dependency_overrides
 
    assert get_db not in app.dependency_overrides


