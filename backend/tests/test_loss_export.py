import csv
import io
from datetime import UTC, datetime

import pytest

from app.db.session import get_db
from app.features.loss_management.export import EXPORT_COLUMNS, render_field_orders_csv
from app.features.loss_management.schemas import InspectionOrderDTO, InspectionStatus
from app.main import app
from tests.test_loss_router import auth_headers, open_client

EXPORT_URL = "/api/v1/losses/inspections/export"
INSPECTIONS_URL = "/api/v1/losses/inspections"
RESULT_COLUMNS = ("data_inspecao", "irregularidade_constatada", "tipo_irregularidade", "kwh_recuperado", "numero_toi")


def make_order(id_inspecao: int, id_uc: str, **overrides) -> InspectionOrderDTO:
    fields = {
        "id_inspecao": id_inspecao,
        "id_uc": id_uc,
        "status": InspectionStatus.GERADA,
        "motivo": None,
        "kwh_estimado": 750.0,
        "fiscal_responsavel": None,
        "irregularidade_constatada": None,
        "tipo_irregularidade": None,
        "kwh_recuperado": None,
        "numero_toi": None,
        "justificativa_cancelamento": None,
        "criado_por": "perdas@venergy.com",
        "criado_em": datetime(2026, 10, 21, 9, 30, tzinfo=UTC),
        "atualizado_em": datetime(2026, 10, 21, 9, 30, tzinfo=UTC),
    }
    return InspectionOrderDTO(**{**fields, **overrides})


def parse_export(content: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(content.lstrip("﻿")), delimiter=";"))


def test_csv_has_one_row_per_order_with_blank_result_columns():
    orders = [make_order(7, "UC-1", fiscal_responsavel="Equipe 3"), make_order(8, "UC-2")]

    rows = parse_export(render_field_orders_csv(orders))

    assert list(rows[0].keys()) == list(EXPORT_COLUMNS)
    assert [row["id_inspecao"] for row in rows] == ["7", "8"]
    assert rows[0]["fiscal_responsavel"] == "Equipe 3"
    assert all(row[column] == "" for row in rows for column in RESULT_COLUMNS)


def test_csv_uses_decimal_comma_for_brazilian_spreadsheets():
    rows = parse_export(render_field_orders_csv([make_order(1, "UC-1", kwh_estimado=1234.5)]))

    assert rows[0]["kwh_estimado"] == "1234,5"


def test_csv_starts_with_utf8_bom_so_excel_reads_accents():
    assert render_field_orders_csv([]).startswith("﻿")


@pytest.mark.parametrize(("kwh", "expected"), [(0.0, "0,0"), (0.1, "0,1"), (1e16, "10000000000000000,0")])
def test_csv_never_writes_scientific_notation_for_kwh(kwh, expected):
    rows = parse_export(render_field_orders_csv([make_order(1, "UC-1", kwh_estimado=kwh)]))

    assert rows[0]["kwh_estimado"] == expected


def test_csv_is_empty_but_keeps_header_without_orders():
    content = render_field_orders_csv([])

    assert parse_export(content) == []
    assert content.lstrip("﻿").splitlines()[0] == ";".join(EXPORT_COLUMNS)


@pytest.mark.parametrize("dangerous_text", ['=HYPERLINK("http://x")', "+cmd", "-1+1", "@SUM(A1)"])
def test_csv_neutralizes_spreadsheet_formulas_in_free_text(dangerous_text):
    rows = parse_export(render_field_orders_csv([make_order(1, "UC-1", motivo=dangerous_text)]))

    assert rows[0]["motivo"] == f"'{dangerous_text}"


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


async def create_order(http_client, headers: dict[str, str], id_uc: str) -> int:
    response = await http_client.post(INSPECTIONS_URL, headers=headers, json={"id_uc": id_uc})
    return response.json()["id_inspecao"]


async def test_export_returns_only_orders_that_go_to_field(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    generated_id = await create_order(client, headers, "UC_FRAUDE")
    dispatched_id = await create_order(client, headers, "UC_ZERADA")
    dispatch = {"status": "pendente", "fiscal_responsavel": "Equipe 3"}
    await client.patch(f"{INSPECTIONS_URL}/{dispatched_id}", headers=headers, json=dispatch)
    cancelled_id = await create_order(client, headers, "UC_NORMAL")
    cancellation = {"status": "cancelada", "justificativa_cancelamento": "Duplicada"}
    await client.patch(f"{INSPECTIONS_URL}/{cancelled_id}", headers=headers, json=cancellation)

    response = await client.get(EXPORT_URL, headers=headers)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    assert ".csv" in response.headers["content-disposition"]
    rows = parse_export(response.text)
    assert sorted(int(row["id_inspecao"]) for row in rows) == sorted([generated_id, dispatched_id])
    assert {row["id_uc"] for row in rows} == {"UC_FRAUDE", "UC_ZERADA"}


async def test_export_is_forbidden_for_roles_without_permission(client):
    headers = await auth_headers(client, "atendimento@venergy.com")

    response = await client.get(EXPORT_URL, headers=headers)

    assert response.status_code == 403
