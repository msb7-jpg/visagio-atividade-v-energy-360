from datetime import date, timedelta

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


async def test_upload_in_the_field_team_format_matches_orders_by_unit(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    field_header = "id_inspecao;id_uc;data;inspetor;resultado;tipo_irregularidade;kwh_recuperado"
    lines = [
        field_header,
        "IN0000007;UC_FRAUDE;09-25-2025;INSP-028  ;IRREGULARIDADE CONFIRMADA;BY-PASS;838,10",
        "IN0000008;UC_SEM_ORDEM;2025-11-08;INSP-031;SEM IRREGULARIDADE;NULL;0,00",
    ]
    files = {"file": ("inspecoes.csv", "\r\n".join(lines).encode("utf-8-sig"), "text/csv")}

    response = await client.post(UPLOAD_URL, headers=headers, files=files)

    body = response.json()
    assert response.status_code == 200
    assert body["conciliadas"] == 1
    assert body["kwh_recuperado_total"] == pytest.approx(838.1)
    assert "UC_SEM_ORDEM" in body["rejeitadas"][0]["motivo"]
    order = await get_order(client, headers, order_id)
    assert order["status"] == "concluida"
    assert order["inspetor"] == "INSP-028"
    assert order["data_inspecao"] == "2025-09-25"
    assert order["fiscal_responsavel"] is None
    assert order["tipo_irregularidade"] == "BY-PASS"


async def test_upload_rejects_rows_with_invalid_inspector_or_future_date_and_keeps_orders_open(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    bad_inspector_id = await create_order(client, headers, "UC_FRAUDE")
    future_date_id = await create_order(client, headers, "UC_ZERADA")
    future_date = (date.today() + timedelta(days=5)).isoformat()
    lines = [
        "id_inspecao;data_inspecao;inspetor;irregularidade_constatada",
        f"{bad_inspector_id};2025-08-15;INSP-041;sim",
        f"{future_date_id};{future_date};INSP-003;sim",
    ]
    files = {"file": ("retorno.csv", "\r\n".join(lines).encode("utf-8-sig"), "text/csv")}

    response = await client.post(UPLOAD_URL, headers=headers, files=files)

    body = response.json()
    assert body["conciliadas"] == 0
    reasons = {row["id_inspecao"]: row["motivo"] for row in body["rejeitadas"]}
    assert "INSP-001 a INSP-040" in reasons[bad_inspector_id]
    assert "não pode ser futura" in reasons[future_date_id]
    assert "Value error" not in " ".join(reasons.values())
    assert (await get_order(client, headers, bad_inspector_id))["status"] == "gerada"
    assert (await get_order(client, headers, future_date_id))["status"] == "gerada"


async def test_upload_in_portal_format_records_inspector_and_date(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    lines = [
        "id_inspecao;data_inspecao;inspetor;irregularidade_constatada",
        f"{order_id};14.08.2025; insp-012 ;nada consta",
    ]
    files = {"file": ("retorno.csv", "\r\n".join(lines).encode("utf-8-sig"), "text/csv")}

    response = await client.post(UPLOAD_URL, headers=headers, files=files)

    assert response.json()["conciliadas"] == 1
    order = await get_order(client, headers, order_id)
    assert (order["inspetor"], order["data_inspecao"]) == ("INSP-012", "2025-08-14")


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


async def test_upload_is_forbidden_for_director_who_only_reads(client):
    manager = await auth_headers(client, "perdas@venergy.com")
    id_inspecao = await create_order(client, manager, "UC_FRAUDE")
    director = await auth_headers(client, "diretor@venergy.com")

    response = await client.post(UPLOAD_URL, headers=director, files=csv_file(f"{id_inspecao};;sim;;1;"))

    assert response.status_code == 403
    assert (await get_order(client, manager, id_inspecao))["status"] == "gerada"
