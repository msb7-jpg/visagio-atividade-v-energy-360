from datetime import date, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.features.loss_management.models import InspectionOrder
from app.main import app
from tests.loss_tariff import BILLING_ROWS

BASE_URL = "/api/v1/losses"
COMPETENCIAS = [f"{year}-{month:02d}" for year in (2024, 2025) for month in range(1, 13)] + ["2026-01"]
RECENT_COMPETENCIAS = COMPETENCIAS[-3:]

# (id_uc, possui_gd, bairro, consumo base, consumo nas 3 competências recentes)
SEED_UNITS = [
    ("UC_FRAUDE", 0, "Centro", 300.0, [50.0, 50.0, 50.0]),
    ("UC_ZERADA", 0, "Centro", 120.0, [150.0, 0.0, 150.0]),
    ("UC_NORMAL", 0, "Centro", 200.0, [200.0, 200.0, 200.0]),
    ("UC_SOLAR", 1, "Centro", 300.0, [40.0, 40.0, 40.0]),
    ("UC_INSPECIONADA", 0, "Centro", 250.0, [50.0, 50.0, 50.0]),
    ("UC_INSPECAO_ANTIGA", 0, "Boa Viagem", 200.0, [50.0, 50.0, 50.0]),
    ("UC_SEM_LEITURA", 0, "Centro", 300.0, [None, None, None]),
]

# Janela de análise da última competência (2026-01) começa em 2024-11: só inspeções a partir dela excluem a UC.
SEED_INSPECTIONS = [
    ("IN1", "UC_INSPECIONADA", "2025-08-10", 1),
    ("IN2", "UC_INSPECAO_ANTIGA", "2023-05-02", 0),
]
# Inspetor de cada inspeção acima, na mesma ordem; fora de ordem de propósito para provar a ordenação da lista.
SEED_INSPECTOR_CODES = ["INSP-002", "INSP-001"]


def build_measurement_rows() -> list[dict[str, object]]:
    rows = []
    for id_uc, _, _, base_kwh, recent_values in SEED_UNITS:
        recent_by_month = dict(zip(RECENT_COMPETENCIAS, recent_values, strict=True))
        # None na janela recente = competência sem leitura (a linha não existe em fato_medicao).
        rows.extend(
            {"id_uc": id_uc, "competencia": competencia, "consumo_kwh": recent_by_month.get(competencia, base_kwh)}
            for competencia in COMPETENCIAS
            if recent_by_month.get(competencia, base_kwh) is not None
        )
    return rows


async def seed_field_history_table(connection) -> None:
    await connection.execute(text(
        "CREATE TABLE fato_inspecoes_perdas (id_inspecao TEXT PRIMARY KEY, id_uc TEXT, data_inspecao TEXT, "
        "irregularidade_constatada BOOLEAN, id_inspetor TEXT)"
    ))
    await connection.execute(
        text(
            "INSERT INTO fato_inspecoes_perdas VALUES (:id_inspecao, :id_uc, :data_inspecao, :irregular, :inspetor)"
        ),
        [
            {
                "id_inspecao": id_inspecao,
                "id_uc": id_uc,
                "data_inspecao": data_inspecao,
                "irregular": irregular,
                "inspetor": inspetor,
            }
            for (id_inspecao, id_uc, data_inspecao, irregular), inspetor in zip(
                SEED_INSPECTIONS, SEED_INSPECTOR_CODES, strict=True
            )
        ],
    )


async def seed_gold_tables(connection, *, with_field_history: bool = True) -> None:
    await connection.execute(text(
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, classe_consumo TEXT, "
        "municipio TEXT, bairro TEXT, possui_gd BOOLEAN)"
    ))
    await connection.execute(text("CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"))
    await connection.execute(text(
        "CREATE TABLE fato_faturamento (competencia TEXT, valor_total_rs REAL, consumo_faturado_kwh REAL)"
    ))
    await connection.execute(
        text("INSERT INTO fato_faturamento VALUES (:competencia, :valor_total_rs, :consumo_faturado_kwh)"), BILLING_ROWS
    )
    await connection.execute(
        text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Residencial', 'Recife', :bairro, :possui_gd)"),
        [{"id_uc": id_uc, "possui_gd": possui_gd, "bairro": bairro} for id_uc, possui_gd, bairro, _, _ in SEED_UNITS],
    )
    await connection.execute(
        text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"), build_measurement_rows()
    )
    if with_field_history:
        await seed_field_history_table(connection)


async def open_client(with_gold_tables: bool, *, with_field_history: bool = True):
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
        if with_gold_tables:
            await seed_gold_tables(connection, with_field_history=with_field_history)
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
    units = response.json()["itens"]
    assert [unit["id_uc"] for unit in units] == ["UC_FRAUDE", "UC_INSPECAO_ANTIGA", "UC_ZERADA"]
    assert units[0]["motivos"] == ["queda_subita"]
    assert units[0]["kwh_estimado_recuperar"] == pytest.approx(750.0)


async def test_role_without_permission_is_forbidden(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert response.status_code == 403


@pytest.mark.parametrize(
    "path",
    ["/suspicious-units", "/queue-summary", "/queue-filters", "/inspections", "/inspections/export"],
)
async def test_director_can_read_every_loss_endpoint(client, path):
    headers = await auth_headers(client, "diretor@venergy.com")

    response = await client.get(f"{BASE_URL}{path}", headers=headers)

    assert response.status_code == 200


async def test_inspectors_are_listed_by_code_from_the_field_history(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/inspectors", headers=headers)

    assert response.status_code == 200
    assert response.json() == [{"codigo": "INSP-001"}, {"codigo": "INSP-002"}]


async def test_director_can_read_the_inspectors(client):
    headers = await auth_headers(client, "diretor@venergy.com")

    response = await client.get(f"{BASE_URL}/inspectors", headers=headers)

    assert response.status_code == 200


async def test_role_without_permission_cannot_read_the_inspectors(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(f"{BASE_URL}/inspectors", headers=headers)

    assert response.status_code == 403


async def test_inspectors_without_the_field_history_table_is_a_clear_error():
    engine, http_client = await open_client(with_gold_tables=True, with_field_history=False)
    async with http_client:
        headers = await auth_headers(http_client, "perdas@venergy.com")
        response = await http_client.get(f"{BASE_URL}/inspectors", headers=headers)
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 500


async def test_orders_list_carries_neighborhood_municipality_and_class_of_the_unit(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_INSPECAO_ANTIGA"})
    await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})

    response = await client.get(f"{BASE_URL}/inspections", headers=headers)

    assert response.status_code == 200
    location_by_unit = {
        order["id_uc"]: (order["bairro"], order["municipio"], order["classe_consumo"]) for order in response.json()
    }
    assert location_by_unit == {
        "UC_INSPECAO_ANTIGA": ("Boa Viagem", "Recife", "Residencial"),
        "UC_FRAUDE": ("Centro", "Recife", "Residencial"),
    }


async def test_orders_list_keeps_an_order_whose_unit_is_not_in_the_registry(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    async for session in app.dependency_overrides[get_db]():
        await session.execute(text("DELETE FROM dim_unidade_consumidora WHERE id_uc = 'UC_FRAUDE'"))
        await session.commit()

    response = await client.get(f"{BASE_URL}/inspections", headers=headers)

    (order,) = response.json()
    location = (order["bairro"], order["municipio"], order["classe_consumo"])
    assert (order["id_uc"], location) == ("UC_FRAUDE", (None, None, None))


async def test_director_cannot_create_or_update_orders(client):
    director = await auth_headers(client, "diretor@venergy.com")
    manager = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=manager, json={"id_uc": "UC_FRAUDE"})
    id_inspecao = created.json()["id_inspecao"]

    create_response = await client.post(f"{BASE_URL}/inspections", headers=director, json={"id_uc": "UC_ZERADA"})
    update_response = await client.patch(
        f"{BASE_URL}/inspections/{id_inspecao}", headers=director, json={"status": "pendente"}
    )

    assert create_response.status_code == 403
    assert update_response.status_code == 403
    orders = (await client.get(f"{BASE_URL}/inspections", headers=manager)).json()
    assert [(order["id_uc"], order["status"]) for order in orders] == [("UC_FRAUDE", "gerada")]


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
    queued_unit = next(unit for unit in queue.json()["itens"] if unit["id_uc"] == "UC_FRAUDE")
    assert queued_unit["situacao"] == "ordem_gerada"

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

    queue_after_conclusion = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    assert "UC_FRAUDE" not in [unit["id_uc"] for unit in queue_after_conclusion.json()["itens"]]


async def test_create_rejects_unit_missing_from_registry(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_QUE_NAO_EXISTE"})
    orders = await client.get(f"{BASE_URL}/inspections", headers=headers)

    assert response.status_code == 404
    assert "UC_QUE_NAO_EXISTE" in response.json()["detail"]
    assert orders.json() == []


async def test_create_computes_estimated_kwh_on_server_like_the_queue(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})

    assert created.status_code == 201
    assert created.json()["kwh_estimado"] == pytest.approx(750.0)


async def test_create_rejects_client_supplied_estimated_kwh(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    payload = {"id_uc": "UC_FRAUDE", "kwh_estimado": 999999}

    response = await client.post(f"{BASE_URL}/inspections", headers=headers, json=payload)

    assert response.status_code == 422


@pytest.mark.parametrize("id_uc", ["UC_NORMAL", "UC_SOLAR", "UC_SEM_LEITURA"])
async def test_registered_unit_outside_queue_gets_manual_order_with_zero_kwh(client, id_uc):
    headers = await auth_headers(client, "perdas@venergy.com")

    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": id_uc})

    assert created.status_code == 201
    assert created.json()["kwh_estimado"] == pytest.approx(0.0)


@pytest.mark.parametrize(
    "payload",
    [
        {"status": "cancelada"},
        {"status": "cancelada", "justificativa_cancelamento": "Cliente regularizou"},
        {"status": "cancelada", "motivo_cancelamento": "porque sim"},
        {"status": "cancelada", "motivo_cancelamento": ""},
    ],
)
async def test_cancel_without_a_listed_reason_is_422_and_keeps_the_order_open(client, payload):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ZERADA"})
    order_url = f"{BASE_URL}/inspections/{created.json()['id_inspecao']}"

    response = await client.patch(order_url, headers=headers, json=payload)

    assert response.status_code == 422
    orders = (await client.get(f"{BASE_URL}/inspections", headers=headers)).json()
    assert [order["status"] for order in orders] == ["gerada"]


async def test_cancel_with_listed_reason_records_it_and_unknown_order_is_404(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ZERADA"})
    order_url = f"{BASE_URL}/inspections/{created.json()['id_inspecao']}"

    cancelled = await client.patch(
        order_url, headers=headers, json={"status": "cancelada", "motivo_cancelamento": "cliente_regularizou"}
    )
    missing = await client.patch(f"{BASE_URL}/inspections/9999", headers=headers, json={"status": "pendente"})

    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelada"
    assert cancelled.json()["motivo_cancelamento"] == "cliente_regularizou"
    assert missing.status_code == 404


async def test_result_records_inspector_and_inspection_date(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    order_url = f"{BASE_URL}/inspections/{created.json()['id_inspecao']}"
    await client.patch(order_url, headers=headers, json={"status": "pendente"})
    result = {
        "status": "concluida",
        "irregularidade_constatada": True,
        "kwh_recuperado": 120.5,
        "inspetor": "INSP-007",
        "data_inspecao": "2026-10-20",
    }

    response = await client.patch(order_url, headers=headers, json=result)

    assert response.status_code == 200
    assert (response.json()["inspetor"], response.json()["data_inspecao"]) == ("INSP-007", "2026-10-20")


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("inspetor", "INSP-041"),
        ("inspetor", "INSP-000"),
        ("inspetor", "Maria"),
        ("data_inspecao", (date.today() + timedelta(days=3)).isoformat()),
    ],
)
async def test_result_with_invalid_inspector_or_future_date_is_422(client, field, value):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    order_url = f"{BASE_URL}/inspections/{created.json()['id_inspecao']}"
    await client.patch(order_url, headers=headers, json={"status": "pendente"})
    result = {"status": "concluida", "irregularidade_constatada": False, field: value}

    response = await client.patch(order_url, headers=headers, json=result)

    assert response.status_code == 422
    assert "Value error" in response.text
    orders = (await client.get(f"{BASE_URL}/inspections", headers=headers)).json()
    assert [order["status"] for order in orders] == ["pendente"]


async def test_cancelled_order_returns_unit_to_queue(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ZERADA"})
    cancel = {"status": "cancelada", "motivo_cancelamento": "repriorizacao_equipe"}
    await client.patch(f"{BASE_URL}/inspections/{created.json()['id_inspecao']}", headers=headers, json=cancel)

    queue = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert "UC_ZERADA" in [unit["id_uc"] for unit in queue.json()["itens"]]


async def test_unit_inspected_within_analysis_window_leaves_queue(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    queued_ids = [unit["id_uc"] for unit in response.json()["itens"]]
    assert "UC_INSPECIONADA" not in queued_ids
    assert "UC_INSPECAO_ANTIGA" in queued_ids


async def test_queue_can_be_filtered_by_bairro(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers, params={"bairro": "Boa Viagem"})

    assert [unit["id_uc"] for unit in response.json()["itens"]] == ["UC_INSPECAO_ANTIGA"]


async def test_queue_default_limit_matches_monthly_field_capacity(client):
    response = await client.get("/openapi.json")

    parameters = response.json()["paths"][f"{BASE_URL}/suspicious-units"]["get"]["parameters"]
    limit_parameter = next(parameter for parameter in parameters if parameter["name"] == "limit")
    assert limit_parameter["schema"]["default"] == 200


async def test_queue_has_no_warnings_when_field_history_is_applied(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert response.json()["avisos"] == []


async def test_queue_works_without_field_history_table_and_warns():
    engine, http_client = await open_client(with_gold_tables=True, with_field_history=False)
    async with http_client:
        headers = await auth_headers(http_client, "perdas@venergy.com")
        response = await http_client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 200
    body = response.json()
    # Sem o histórico de campo, UC_INSPECIONADA volta a aparecer: a exclusão por inspeção não foi aplicada.
    assert sorted(unit["id_uc"] for unit in body["itens"]) == [
        "UC_FRAUDE", "UC_INSPECAO_ANTIGA", "UC_INSPECIONADA", "UC_ZERADA"
    ]
    assert [warning["codigo"] for warning in body["avisos"]] == ["historico_campo_nao_aplicado"]
    assert "Ordens concluídas no sistema continuam sendo excluídas" in body["avisos"][0]["mensagem"]


async def test_queue_without_field_history_still_marks_units_with_system_orders():
    engine, http_client = await open_client(with_gold_tables=True, with_field_history=False)
    async with http_client:
        headers = await auth_headers(http_client, "perdas@venergy.com")
        await http_client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
        response = await http_client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 200
    situations = {unit["id_uc"]: unit["situacao"] for unit in response.json()["itens"]}
    assert situations["UC_FRAUDE"] == "ordem_gerada"


async def test_missing_gold_tables_returns_clear_error():
    engine, http_client = await open_client(with_gold_tables=False)
    async with http_client:
        headers = await auth_headers(http_client, "perdas@venergy.com")
        response = await http_client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 500
    assert "fato_medicao" in response.json()["detail"]
