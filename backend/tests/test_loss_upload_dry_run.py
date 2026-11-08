"""Pré-visualização da planilha de campo (`dry_run`): valida e resume, mas não grava nenhuma ordem."""

import pytest

from app.db.session import get_db
from app.main import app
from tests.test_loss_export import create_order
from tests.test_loss_router import auth_headers, open_client
from tests.test_loss_upload_router import UPLOAD_URL, csv_file, get_order


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


async def test_dry_run_summarizes_the_batch_without_writing_anything(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    files = csv_file(f"{order_id};14.08.2025;CONFIRMADA;by-pass;1.250,5;TOI-7", "9999;2025-08-15;sim;;10;")

    response = await client.post(UPLOAD_URL, headers=headers, params={"dry_run": "true"}, files=files)

    body = response.json()
    assert response.status_code == 200
    assert body["simulacao"] is True
    assert body["conciliadas"] == 1
    assert body["kwh_recuperado_total"] == pytest.approx(1250.5)
    assert [(row["linha"], row["id_inspecao"]) for row in body["rejeitadas"]] == [(3, 9999)]
    order = await get_order(client, headers, order_id)
    assert order["status"] == "gerada"
    assert order["kwh_recuperado"] is None


async def test_import_after_the_preview_writes_the_same_batch(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    line = f"{order_id};14.08.2025;CONFIRMADA;by-pass;1.250,5;TOI-7"
    preview = await client.post(UPLOAD_URL, headers=headers, params={"dry_run": "true"}, files=csv_file(line))

    imported = await client.post(UPLOAD_URL, headers=headers, files=csv_file(line))

    assert preview.json()["conciliadas"] == imported.json()["conciliadas"] == 1
    assert imported.json()["simulacao"] is False
    assert (await get_order(client, headers, order_id))["status"] == "concluida"


async def test_dry_run_still_requires_the_write_role(client):
    headers = await auth_headers(client, "diretor@venergy.com")

    response = await client.post(UPLOAD_URL, headers=headers, params={"dry_run": "true"}, files=csv_file())

    assert response.status_code == 403
