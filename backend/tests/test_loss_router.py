import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.features.loss_management.models import InspectionOrder
from app.main import app

BASE_URL = "/api/v1/losses"
COMPETENCIAS = [f"{year}-{month:02d}" for year in (2024, 2025) for month in range(1, 13)] + ["2026-01"]
RECENT_COMPETENCIAS = COMPETENCIAS[-3:]

# (id_uc, possui_gd, consumo base, consumo nas 3 competências recentes)
SEED_UNITS = [
    ("UC_FRAUDE", 0, 300.0, [50.0, 50.0, 50.0]),
    ("UC_ZERADA", 0, 150.0, [150.0, 0.0, 150.0]),
    ("UC_NORMAL", 0, 200.0, [200.0, 200.0, 200.0]),
    ("UC_SOLAR", 1, 300.0, [40.0, 40.0, 40.0]),
]


def build_measurement_rows() -> list[dict[str, object]]:
    rows = []
    for id_uc, _, base_kwh, recent_values in SEED_UNITS:
        recent_by_month = dict(zip(RECENT_COMPETENCIAS, recent_values, strict=True))
        rows.extend(
            {"id_uc": id_uc, "competencia": competencia, "consumo_kwh": recent_by_month.get(competencia, base_kwh)}
            for competencia in COMPETENCIAS
        )
    return rows


async def seed_gold_tables(connection) -> None:
    await connection.execute(text(
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, classe_consumo TEXT, "
        "municipio TEXT, bairro TEXT, possui_gd BOOLEAN)"
    ))
    await connection.execute(text("CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"))
    await connection.execute(
        text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Residencial', 'Recife', 'Centro', :possui_gd)"),
        [{"id_uc": id_uc, "possui_gd": possui_gd} for id_uc, possui_gd, _, _ in SEED_UNITS],
    )
    await connection.execute(
        text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"), build_measurement_rows()
    )


async def open_client(with_gold_tables: bool):
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        if with_gold_tables:
            await seed_gold_tables(connection)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    return engine, AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def auth_headers(http_client: AsyncClient, email: str) -> dict[str, str]:
    response = await http_client.post("/api/v1/auth/login", json={"email": email, "senha": "venergy123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def test_suspicious_units_ranked_and_solar_excluded(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert response.status_code == 200
    units = response.json()
    assert [unit["id_uc"] for unit in units] == ["UC_FRAUDE", "UC_ZERADA"]
    assert units[0]["motivos"] == ["queda_subita"]
    assert units[0]["kwh_estimado_recuperar"] == pytest.approx(750.0)


async def test_role_without_permission_is_forbidden(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert response.status_code == 403


async def test_inspection_lifecycle(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    assert created.status_code == 201
    order = created.json()
    assert order["status"] == "gerada"
    assert order["criado_por"] == "perdas@venergy.com"

    duplicated = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    assert duplicated.status_code == 409

    queue = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    assert "UC_FRAUDE" not in [unit["id_uc"] for unit in queue.json()]

    order_url = f"{BASE_URL}/inspections/{order['id_inspecao']}"
    skipped = await client.patch(order_url, headers=headers, json={"status": "concluida"})
    assert skipped.status_code == 409

    dispatch = {"status": "pendente", "fiscal_responsavel": "Equipe 3"}
    in_field = await client.patch(order_url, headers=headers, json=dispatch)
    assert in_field.json()["status"] == "pendente"

    result = {"status": "concluida", "irregularidade_constatada": True, "kwh_recuperado": 680.0, "numero_toi": "TOI-1"}
    concluded = await client.patch(order_url, headers=headers, json=result)
    assert concluded.status_code == 200
    assert concluded.json()["kwh_recuperado"] == pytest.approx(680.0)

    listed = await client.get(f"{BASE_URL}/inspections", headers=headers, params={"status": "concluida"})
    assert [item["id_inspecao"] for item in listed.json()] == [order["id_inspecao"]]


async def test_cancel_requires_justification_and_unknown_order_is_404(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ZERADA"})
    order_url = f"{BASE_URL}/inspections/{created.json()['id_inspecao']}"

    without_reason = await client.patch(order_url, headers=headers, json={"status": "cancelada"})
    cancelled = await client.patch(
        order_url, headers=headers, json={"status": "cancelada", "justificativa_cancelamento": "Cliente regularizou"}
    )
    missing = await client.patch(f"{BASE_URL}/inspections/9999", headers=headers, json={"status": "pendente"})

    assert without_reason.status_code == 400
    assert cancelled.json()["status"] == "cancelada"
    assert missing.status_code == 404


async def test_missing_gold_tables_returns_clear_error():
    engine, http_client = await open_client(with_gold_tables=False)
    async with http_client:
        headers = await auth_headers(http_client, "perdas@venergy.com")
        response = await http_client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 500
    assert "fato_medicao" in response.json()["detail"]
