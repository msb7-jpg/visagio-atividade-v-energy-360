import pytest

from app.db.session import get_db
from app.features.loss_management.router import MAX_UPLOAD_BYTES
from app.main import app
from tests.test_loss_export import create_order
from tests.test_loss_router import auth_headers, open_client

UPLOAD_URL = "/api/v1/losses/inspections/upload"
INSPECTIONS_URL = "/api/v1/losses/inspections"
HEADER = "id_inspecao;data_inspecao;irregularidade_constatada;tipo_irregularidade;kwh_recuperado;numero_toi"


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


def csv_file(*lines: str, name: str = "retorno.csv") -> dict:
    content = "\r\n".join([HEADER, *lines]).encode("utf-8-sig")
    return {"file": (name, content, "text/csv")}


async def get_order(http_client, headers: dict[str, str], id_inspecao: int) -> dict:
    orders = (await http_client.get(INSPECTIONS_URL, headers=headers)).json()
    return next(order for order in orders if order["id_inspecao"] == id_inspecao)


async def test_upload_completes_orders_and_summarizes_the_batch(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    confirmed_id = await create_order(client, headers, "UC_FRAUDE")
    clean_id = await create_order(client, headers, "UC_ZERADA")
    await client.patch(f"{INSPECTIONS_URL}/{clean_id}", headers=headers, json={"status": "pendente"})
    files = csv_file(
        f"{confirmed_id};14.08.2025;CONFIRMADA;by-pass;1.250,5;TOI-7",
        f"{clean_id};2025-08-15;NADA CONSTA;;;",
        "9999;2025-08-15;sim;;10;",
        f"{confirmed_id + clean_id + 1};;;;;",
    )

    response = await client.post(UPLOAD_URL, headers=headers, files=files)

    assert response.status_code == 200
    body = response.json()
    assert body["conciliadas"] == 2
    assert body["ignoradas"] == 1
    assert body["kwh_recuperado_total"] == pytest.approx(1250.5)
    assert [(row["linha"], row["id_inspecao"]) for row in body["rejeitadas"]] == [(4, 9999)]
    confirmed = await get_order(client, headers, confirmed_id)
    assert confirmed["status"] == "concluida"
    assert confirmed["irregularidade_constatada"] is True
    assert confirmed["kwh_recuperado"] == pytest.approx(1250.5)
    assert confirmed["numero_toi"] == "TOI-7"
    assert (await get_order(client, headers, clean_id))["irregularidade_constatada"] is False


async def test_upload_twice_rejects_orders_already_completed(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    files = csv_file(f"{order_id};;sim;;100;")
    await client.post(UPLOAD_URL, headers=headers, files=files)

    second = await client.post(UPLOAD_URL, headers=headers, files=csv_file(f"{order_id};;sim;;100;"))

    body = second.json()
    assert body["conciliadas"] == 0
    assert "concluida" in body["rejeitadas"][0]["motivo"]


async def test_upload_rejects_unsupported_file_type(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.post(UPLOAD_URL, headers=headers, files={"file": ("retorno.pdf", b"x", "application/pdf")})

    assert response.status_code == 400


async def test_upload_rejects_oversized_file(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    huge = {"file": ("retorno.csv", b"x" * (MAX_UPLOAD_BYTES + 1), "text/csv")}

    response = await client.post(UPLOAD_URL, headers=headers, files=huge)

    assert response.status_code == 413


async def test_upload_requires_a_file(client):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.post(UPLOAD_URL, headers=headers)

    assert response.status_code == 422


async def test_upload_is_forbidden_for_roles_without_permission(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.post(UPLOAD_URL, headers=headers, files=csv_file("1;;sim;;1;"))

    assert response.status_code == 403
