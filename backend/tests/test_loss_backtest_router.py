"""Backtest da fila: seleção no corte (sem olhar o futuro) medida nas inspeções dos meses seguintes."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.features.loss_management.models import InspectionOrder
from app.main import app
from tests.loss_tariff import BILLING_ROWS
from tests.test_loss_router import BASE_URL, auth_headers

COMPETENCIAS = [f"{year}-{month:02d}" for year in (2024, 2025) for month in range(1, 13)]
DROP_STARTS = "2025-05"  # queda de 90% a partir daqui: no corte de 2025-07 as UCs já estão na fila
# (id_uc, data da inspeção na janela ago-out/2025, irregular, kWh recuperado)
SEEDED = [("UC_A", "2025-08-10", True, 120.0), ("UC_B", "2025-09-02", False, 0.0), ("UC_C", None, None, None)]

SCHEMA = (
    (
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, classe_consumo TEXT, municipio TEXT, "
        "bairro TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    "CREATE TABLE fato_faturamento (competencia TEXT, valor_total_rs REAL, consumo_faturado_kwh REAL)",
    (
        "CREATE TABLE fato_inspecoes_perdas (id_inspecao TEXT, id_uc TEXT, data_inspecao TEXT, "
        "irregularidade_constatada BOOLEAN, id_inspetor TEXT, kwh_recuperado REAL)"
    ),
)
INSERT_INSPECTION = (
    "INSERT INTO fato_inspecoes_perdas VALUES ('I', :id_uc, :inspected_on, :irregular, 'INSP-001', :kwh)"
)


async def _seed_unit(connection, id_uc: str) -> None:
    await connection.execute(
        text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Residencial', 'Recife', 'Centro', 0)"),
        {"id_uc": id_uc},
    )
    rows = [
        {"id_uc": id_uc, "competencia": competencia, "consumo_kwh": 30.0 if competencia >= DROP_STARTS else 300.0}
        for competencia in COMPETENCIAS
    ]
    await connection.execute(text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"), rows)


async def _seed(connection) -> None:
    for statement in SCHEMA:
        await connection.execute(text(statement))
    billing = "INSERT INTO fato_faturamento VALUES (:competencia, :valor_total_rs, :consumo_faturado_kwh)"
    await connection.execute(text(billing), BILLING_ROWS)
    for id_uc, inspected_on, irregular, kwh in SEEDED:
        await _seed_unit(connection, id_uc)
        if inspected_on:
            params = {"id_uc": id_uc, "inspected_on": inspected_on, "irregular": irregular, "kwh": kwh}
            await connection.execute(text(INSERT_INSPECTION), params)
    other = {"id_uc": "OUTRA", "inspected_on": "2025-10-05", "irregular": False, "kwh": 0.0}
    await connection.execute(text(INSERT_INSPECTION), other)  # fora da seleção: só conta na linha de base


@pytest.fixture
async def client():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        await _seed(connection)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def test_backtest_measures_the_selection_against_the_following_inspections(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/backtest", headers=headers, params={"corte": "2025-07"})

    body = response.json()
    assert response.status_code == 200
    assert body["backtest_executado"] is True
    assert body["data_corte"] == "2025-07"
    assert (body["janela_resultado_inicio"], body["janela_resultado_fim"]) == ("2025-08-01", "2025-10-31")
    assert body["n_selecionadas"] == 3
    assert body["n_inspecionadas"] == 2
    assert body["n_irregulares"] == 1
    assert body["precisao_selecao"] == pytest.approx(0.5)
    assert body["inspecoes_janela"] == 3
    assert body["linha_base"] == pytest.approx(1 / 3)
    assert body["kwh_recuperado"] == pytest.approx(120.0)


async def test_backtest_defaults_to_the_competencia_before_the_first_inspection(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    body = (await client.get(f"{BASE_URL}/backtest", headers=headers)).json()

    assert body["data_corte"] == "2025-07"
    assert body["cortes_disponiveis"] == ["2025-07", "2025-08", "2025-09"]


async def test_backtest_does_not_see_units_inspected_before_the_cutoff(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    body = (await client.get(f"{BASE_URL}/backtest", headers=headers, params={"corte": "2025-09"})).json()

    # UC_A e UC_B já foram inspecionadas (ago e set) antes do corte: não entram mais na seleção.
    assert body["n_selecionadas"] == 1


async def test_backtest_rejects_a_cutoff_outside_the_inspection_history(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/backtest", headers=headers, params={"corte": "2030-01"})

    assert response.status_code == 400


async def test_backtest_rejects_a_malformed_cutoff(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/backtest", headers=headers, params={"corte": "julho"})

    assert response.status_code == 422


async def test_backtest_series_returns_every_cutoff_with_the_default_size(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/backtest/series", headers=headers)

    body = response.json()
    assert response.status_code == 200
    assert body["tamanho"] == 200
    assert [result["data_corte"] for result in body["cortes"]] == ["2025-07", "2025-08", "2025-09"]


async def test_backtest_series_gives_each_cutoff_the_same_result_as_the_single_cutoff_endpoint(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    series = (await client.get(f"{BASE_URL}/backtest/series", headers=headers)).json()
    single = await client.get(f"{BASE_URL}/backtest", headers=headers, params={"corte": "2025-07", "tamanho": 200})

    assert series["cortes"][0] == single.json()


async def test_backtest_series_requires_a_losses_role(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(f"{BASE_URL}/backtest/series", headers=headers)

    assert response.status_code == 403
