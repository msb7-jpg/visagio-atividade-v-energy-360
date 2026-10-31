from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from tests.customer360_seed import seed_customer360_tables

BASE_URL = "/api/v1/customers"
ATTENDANT_EMAIL = "atendimento@venergy.com"


@asynccontextmanager
async def seeded_client(with_gold_tables: bool = True) -> AsyncGenerator[AsyncClient]:
    """Cliente HTTP com o `get_db` apontando para um SQLite em memória populado pela seed."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        if with_gold_tables:
            await seed_customer360_tables(connection)
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
    assert body["nome_titular"] == "Jose Santos"
    assert body["data_conexao_gd"] == "2025-09-15"


async def test_history_answers_high_bill_by_consumption(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100003/history", headers=attendant_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["competencia_referencia"] == "2026-06"
    assert len(body["meses"]) == 12
    assert body["diagnostico"]["tendencia_consumo"] == "SUBIU"
    assert body["diagnostico"]["variacao_consumo_pct"] == pytest.approx(40.0)


async def test_events_return_feeder_quality_and_tickets(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100001/events", headers=attendant_headers)

    body = response.json()
    assert len(body["qualidade_alimentador"]) == 12
    assert body["qualidade_alimentador"][0]["competencia"] == "2026-06"
    assert any(month["violou_meta"] for month in body["qualidade_alimentador"])
    assert [ticket["numero_protocolo"] for ticket in body["chamados"]] == ["PRT-2026-0002", "PRT-2026-0001"]


async def test_events_list_unit_outages_after_connection_most_recent_first(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100001/events", headers=attendant_headers)

    outages = response.json()["interrupcoes_uc"]
    assert [outage["id_ocorrencia"] for outage in outages] == ["OC000002", "OC000001"]
    assert outages[0]["duracao_horas"] == pytest.approx(4.2)
    assert (outages[0]["tipo_ocorrencia"], outages[0]["causa"]) == ("FIO PARTIDO", "VEGETACAO")
    assert outages[1]["fim_interrupcao"] == "2025-07-14 20:50:00"


async def test_events_summarize_every_unit_outage_even_beyond_the_list_limit(client, attendant_headers, monkeypatch):
    monkeypatch.setattr("app.features.customer360.service.LIMITE_INTERRUPCOES_UC", 1)

    response = await client.get(f"{BASE_URL}/UC100001/events", headers=attendant_headers)

    body = response.json()
    assert [outage["id_ocorrencia"] for outage in body["interrupcoes_uc"]] == ["OC000002"]
    summary = body["resumo_interrupcoes_uc"]
    assert summary["total_interrupcoes"] == 2
    assert summary["total_horas"] == pytest.approx(6.7)
    assert summary["mais_longa"]["id_ocorrencia"] == "OC000002"


async def test_events_list_loss_inspections_most_recent_first(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100003/events", headers=attendant_headers)

    inspections = response.json()["inspecoes"]
    assert [inspection["data_inspecao"] for inspection in inspections] == ["2025-11-04", "2025-08-12"]
    assert inspections[0]["irregularidade_constatada"] is True
    assert inspections[0]["tipo_irregularidade"] == "BY-PASS"
    assert inspections[0]["kwh_recuperado"] == pytest.approx(1250.5)


async def test_unit_without_outages_or_inspections_returns_empty_lists(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100006/events", headers=attendant_headers)

    body = response.json()
    assert (body["interrupcoes_uc"], body["inspecoes"]) == ([], [])
    assert body["resumo_interrupcoes_uc"] == {"total_interrupcoes": 0, "total_horas": 0.0, "mais_longa": None}


async def test_events_of_feeder_without_quality_data_are_empty(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC100005/events", headers=attendant_headers)

    assert response.status_code == 200
    assert response.json()["qualidade_alimentador"] == []


async def test_unknown_unit_returns_404(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/UC999999/summary", headers=attendant_headers)

    assert response.status_code == 404
    assert response.json()["error_type"] == "CustomerNotFoundError"


async def test_requires_authentication(client):
    response = await client.get(f"{BASE_URL}/UC100001/summary")

    assert response.status_code == 401


async def test_director_can_access(client):
    headers = await login(client, "diretor@venergy.com")
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


async def test_search_suggests_units_by_number_prefix(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "10000"}, headers=attendant_headers)

    assert response.status_code == 200
    suggestions = response.json()
    assert [suggestion["id_uc"] for suggestion in suggestions][:3] == ["UC100001", "UC100002", "UC100003"]
    assert suggestions[0]["bairro"] == "Arruda"


async def test_search_finds_unit_by_meter_number(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "MD500002"}, headers=attendant_headers)

    assert [suggestion["id_uc"] for suggestion in response.json()] == ["UC100002"]


async def test_search_finds_units_by_part_of_holder_name(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "  silva "}, headers=attendant_headers)

    suggestions = response.json()
    assert [suggestion["id_uc"] for suggestion in suggestions] == ["UC100001", "UC100005"]
    assert suggestions[0]["nome_titular"] == "Maria da Silva"


async def test_search_treats_like_wildcards_as_text(client, attendant_headers):
    response = await client.get(f"{BASE_URL}/search", params={"q": "%%%"}, headers=attendant_headers)

    assert response.json() == []


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


@pytest.mark.parametrize("path", ["/{id_uc}/summary", "/{id_uc}/history", "/{id_uc}/events"])
def test_endpoints_document_auth_not_found_and_gold_errors(path):
    operation = app.openapi()["paths"][f"{BASE_URL}{path}"]["get"]

    assert operation["summary"]
    assert {"401", "403", "404", "500"} <= operation["responses"].keys()
