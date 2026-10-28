from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from tests.customer360_seed import seed_customer360_tables

BASE_URL = "/api/v1/customers"
ATTENDANT_EMAIL = "atendimento@venergy.com"


@asynccontextmanager
async def seeded_client(with_gold_tables: bool = True, with_holder_name: bool = False) -> AsyncGenerator[AsyncClient]:
    """Cliente HTTP com o `get_db` apontando para um SQLite em memória populado pela seed."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        if with_gold_tables:
            await seed_customer360_tables(connection)
        if with_holder_name:
            await connection.execute(text("ALTER TABLE dim_unidade_consumidora ADD COLUMN nome_titular TEXT"))
            await connection.execute(text("UPDATE dim_unidade_consumidora SET nome_titular = 'Edvaldo Pereira'"))
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
        await engine.dispose()


async def login(http_client: AsyncClient, email: str) -> dict[str, str]:
    response = await http_client.post("/api/v1/auth/login", json={"email": email, "senha": "venergy123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
async def client():
    async with seeded_client() as http_client:
        yield http_client


@pytest.fixture
async def attendant_headers(client):
    return await login(client, ATTENDANT_EMAIL)


async def test_summary_returns_registration_meter_and_solar(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100002/summary", headers=attendant_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["alimentador"] == "ALM-REC-004"
    assert body["numero_medidor_ativo"] == "MD500002"
    assert body["possui_gd"] is True
    assert body["potencia_gd_kw"] == pytest.approx(4.5)
    assert body["nome_titular"] is None


async def test_summary_exposes_holder_name_when_gold_has_column():
    async with seeded_client(with_holder_name=True) as http_client:
        headers = await login(http_client, ATTENDANT_EMAIL)
        response = await http_client.get(f"{BASE_URL}/UC100001/summary", headers=headers)

    assert response.json()["nome_titular"] == "Edvaldo Pereira"


async def test_history_answers_high_bill_by_consumption(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100003/history", headers=attendant_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["competencia_referencia"] == "2026-06"
    assert len(body["meses"]) == 12
    assert body["diagnostico"]["tendencia_consumo"] == "SUBIU"
    assert body["diagnostico"]["variacao_consumo_pct"] == pytest.approx(40.0)


async def test_history_answers_high_bill_by_tariff_flag(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100004/history", headers=attendant_headers)

    body = response.json()
    assert body["diagnostico"]["tendencia_consumo"] == "ESTAVEL"
    assert body["diagnostico"]["bandeira_mudou"] is True
    assert {invoice["status_pagamento"] for invoice in body["faturas_em_aberto"]} == {"ABERTA", "VENCIDA"}


async def test_events_return_feeder_quality_and_tickets(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100001/events", headers=attendant_headers)

    body = response.json()
    assert len(body["qualidade_alimentador"]) == 12
    assert body["qualidade_alimentador"][0]["competencia"] == "2026-06"
    assert any(month["violou_meta"] for month in body["qualidade_alimentador"])
    assert [ticket["numero_protocolo"] for ticket in body["chamados"]] == ["PRT-2026-0002", "PRT-2026-0001"]


async def test_events_of_feeder_without_quality_data_are_empty(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100005/events", headers=attendant_headers)

    assert response.status_code == 200
    assert response.json()["qualidade_alimentador"] == []


@pytest.mark.parametrize("endpoint", ["summary", "history", "events"])
async def test_unknown_unit_returns_404(client, attendant_headers, endpoint):
    response = await client.get(f"{BASE_URL}/UC999999/{endpoint}", headers=attendant_headers)

    assert response.status_code == 404
    assert response.json()["error_type"] == "CustomerNotFoundError"


@pytest.mark.parametrize("endpoint", ["summary", "history", "events"])
async def test_requires_authentication(client, endpoint):
    response = await client.get(f"{BASE_URL}/UC100001/{endpoint}")

    assert response.status_code == 401


@pytest.mark.parametrize(
    "email",
    [
        "diretor@venergy.com",
        "gerente.atendimento@venergy.com",
        "perdas@venergy.com",
        "operacao@venergy.com",
    ],
)
async def test_authorized_profiles_can_access(client, email):
    headers = await login(client, email)
    response = await client.get(f"{BASE_URL}/UC100001/summary", headers=headers)

    assert response.status_code == 200


async def test_typed_number_is_normalized(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/%20uc100003%20/history", headers=attendant_headers)

    assert response.status_code == 200
    assert response.json()["id_uc"] == "UC100003"


async def test_missing_gold_tables_return_database_error():
    async with seeded_client(with_gold_tables=False) as http_client:
        headers = await login(http_client, ATTENDANT_EMAIL)
        response = await http_client.get(f"{BASE_URL}/UC100001/summary", headers=headers)

    assert response.status_code == 500
    assert response.json()["error_type"] == "DatabaseReadError"


async def test_history_explains_longer_billing_period(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100006/history", headers=attendant_headers)

    diagnosis = response.json()["diagnostico"]
    assert diagnosis["tendencia_consumo"] == "SUBIU"
    assert (diagnosis["dias_faturamento"], diagnosis["dias_faturamento_ano_anterior"]) == (36, 30)
    assert diagnosis["tendencia_media_diaria"] == "ESTAVEL"


async def test_history_returns_twelve_month_totals_and_tariff(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100003/history", headers=attendant_headers)

    body = response.json()
    assert body["resumo_12_meses"]["meses_comparados"] == 12
    assert body["resumo_12_meses"]["variacao_consumo_pct"] == pytest.approx(40.0)
    assert body["diagnostico"]["variacao_tarifa_pct"] == pytest.approx(10.0)


async def test_search_suggests_units_by_number_prefix(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "10000"}, headers=attendant_headers)

    assert response.status_code == 200
    suggestions = response.json()
    assert [suggestion["id_uc"] for suggestion in suggestions][:3] == ["UC100001", "UC100002", "UC100003"]
    assert suggestions[0]["bairro"] == "Arruda"


async def test_search_finds_unit_by_meter_number(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "MD500002"}, headers=attendant_headers)

    assert [suggestion["id_uc"] for suggestion in response.json()] == ["UC100002"]


async def test_search_respects_limit_and_minimum_length(client, attendant_headers):
    limited = await client.get(f"{BASE_URL}/search", params={"q": "UC1", "limite": 2}, headers=attendant_headers)
    too_short = await client.get(f"{BASE_URL}/search", params={"q": "10"}, headers=attendant_headers)

    assert len(limited.json()) == 2
    assert too_short.json() == []


async def test_digits_only_number_opens_the_unit(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/100004/summary", headers=attendant_headers)

    assert response.status_code == 200
    assert response.json()["id_uc"] == "UC100004"


async def test_history_reports_payment_punctuality(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100004/history", headers=attendant_headers)

    punctuality = response.json()["pontualidade"]
    assert punctuality["faturas_avaliadas"] == 11
    assert (punctuality["pagas_em_dia"], punctuality["pagas_com_atraso"]) == (8, 2)
    assert punctuality["atraso_medio_dias"] == pytest.approx(6.0)
    assert punctuality["vencidas_em_aberto"] == 1
