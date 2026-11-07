"""Trilha de auditoria pela API: cada mudança da ordem grava quem, quando e o que mudou."""

import pytest

from app.db.session import get_db
from app.main import app
from tests.test_loss_export import create_order
from tests.test_loss_router import auth_headers, open_client
from tests.test_loss_upload_router import UPLOAD_URL, csv_file

INSPECTIONS_URL = "/api/v1/losses/inspections"
PERDAS_EMAIL = "perdas@venergy.com"


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


async def _events(client, headers, id_inspecao: int) -> list[dict]:
    response = await client.get(f"{INSPECTIONS_URL}/{id_inspecao}/events", headers=headers)
    assert response.status_code == 200
    return response.json()


async def test_trail_records_creation_and_each_status_change_with_the_author(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    order_id = await create_order(client, headers, "UC_FRAUDE")
    await client.patch(f"{INSPECTIONS_URL}/{order_id}", headers=headers, json={"status": "pendente"})

    events = await _events(client, headers, order_id)

    assert [event["tipo"] for event in events] == ["gerada", "em_campo"]
    assert {event["autor"] for event in events} == {PERDAS_EMAIL}
    assert events[1]["status_anterior"] == "gerada"
    assert events[1]["status_novo"] == "pendente"
    assert events[1]["alteracoes"] == {"status": ["gerada", "pendente"]}


async def test_trail_records_the_cancellation_reason_before_and_after(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    order_id = await create_order(client, headers, "UC_FRAUDE")
    cancel = {"status": "cancelada", "motivo_cancelamento": "cliente_regularizou"}
    await client.patch(f"{INSPECTIONS_URL}/{order_id}", headers=headers, json=cancel)

    events = await _events(client, headers, order_id)

    assert events[-1]["tipo"] == "cancelada"
    assert events[-1]["alteracoes"]["motivo_cancelamento"] == [None, "cliente_regularizou"]


async def test_trail_records_the_result_imported_from_a_spreadsheet(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    order_id = await create_order(client, headers, "UC_FRAUDE")
    files = csv_file(f"{order_id};14.08.2025;CONFIRMADA;by-pass;1.250,5;TOI-7")

    await client.post(UPLOAD_URL, headers=headers, files=files)
    events = await _events(client, headers, order_id)

    imported = events[-1]
    assert imported["tipo"] == "resultado_importado"
    assert imported["status_anterior"] == "gerada"
    assert imported["status_novo"] == "concluida"
    assert imported["autor"] == PERDAS_EMAIL
    assert imported["alteracoes"]["kwh_recuperado"] == [None, 1250.5]


async def test_preview_does_not_write_to_the_trail(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    order_id = await create_order(client, headers, "UC_FRAUDE")
    files = csv_file(f"{order_id};14.08.2025;CONFIRMADA;by-pass;1.250,5;TOI-7")

    await client.post(UPLOAD_URL, headers=headers, params={"dry_run": "true"}, files=files)

    assert [event["tipo"] for event in await _events(client, headers, order_id)] == ["gerada"]


async def test_trail_of_a_missing_order_is_404(client):
    headers = await auth_headers(client, PERDAS_EMAIL)

    response = await client.get(f"{INSPECTIONS_URL}/999999/events", headers=headers)

    assert response.status_code == 404


async def test_director_can_read_the_trail(client):
    writer = await auth_headers(client, PERDAS_EMAIL)
    order_id = await create_order(client, writer, "UC_FRAUDE")
    reader = await auth_headers(client, "diretor@venergy.com")

    response = await client.get(f"{INSPECTIONS_URL}/{order_id}/events", headers=reader)

    assert response.status_code == 200
