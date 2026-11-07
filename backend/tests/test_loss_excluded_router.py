"""Aba "Fora da fila": UCs com queda que a fila não traz, com motivo e data de reavaliação."""

import pytest

from app.main import app
from tests.test_loss_router import BASE_URL, auth_headers, open_client

PERDAS_EMAIL = "perdas@venergy.com"


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def _excluded(client, headers, **params):
    response = await client.get(f"{BASE_URL}/excluded-units", headers=headers, params=params)
    assert response.status_code == 200
    return response.json()


async def test_excluded_units_explain_gd_and_clean_inspection(client):
    headers = await auth_headers(client, PERDAS_EMAIL)

    body = await _excluded(client, headers)

    by_unit = {unit["id_uc"]: unit for unit in body["itens"]}
    assert set(by_unit) == {"UC_SOLAR", "UC_INSPECIONADA"}
    assert by_unit["UC_SOLAR"]["motivo_exclusao"] == "possui_gd"
    assert by_unit["UC_SOLAR"]["volta_a_ser_avaliada"] is None
    assert by_unit["UC_INSPECIONADA"]["motivo_exclusao"] == "inspecionada_sem_achado"
    assert by_unit["UC_INSPECIONADA"]["data_evento"] == "2025-08-10"
    assert by_unit["UC_INSPECIONADA"]["volta_a_ser_avaliada"] == "2026-11-01"
    assert body["total"] == 2


async def test_excluded_units_summary_counts_every_reason_even_when_filtered(client):
    headers = await auth_headers(client, PERDAS_EMAIL)

    body = await _excluded(client, headers, motivo="possui_gd")

    assert [unit["id_uc"] for unit in body["itens"]] == ["UC_SOLAR"]
    assert body["total"] == 1
    assert {entry["motivo"]: entry["total"] for entry in body["resumo"]} == {
        "possui_gd": 1,
        "inspecionada_sem_achado": 1,
    }


async def test_excluded_units_never_lists_a_unit_that_is_in_the_queue(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    queue = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)
    queued_ids = {unit["id_uc"] for unit in queue.json()["itens"]}

    body = await _excluded(client, headers)

    assert queued_ids.isdisjoint(unit["id_uc"] for unit in body["itens"])


async def test_excluded_units_cancelled_order_blocks_unit_for_ninety_days(client):
    headers = await auth_headers(client, PERDAS_EMAIL)
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})
    cancel = {"status": "cancelada", "motivo_cancelamento": "cliente_regularizou"}
    await client.patch(f"{BASE_URL}/inspections/{created.json()['id_inspecao']}", headers=headers, json=cancel)

    body = await _excluded(client, headers, motivo="cancelamento_bloqueante")

    assert [unit["id_uc"] for unit in body["itens"]] == ["UC_FRAUDE"]
    assert body["itens"][0]["volta_a_ser_avaliada"] is not None


async def test_excluded_units_rejects_role_without_permission(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(f"{BASE_URL}/excluded-units", headers=headers)

    assert response.status_code == 403
