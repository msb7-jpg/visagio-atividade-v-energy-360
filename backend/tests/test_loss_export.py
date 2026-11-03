import csv
import io
from datetime import UTC, date, datetime

import pytest

from app.db.session import get_db
from app.features.loss_management.export import EXPORT_COLUMNS, render_field_orders_csv
from app.features.loss_management.schemas import InspectionOrderDTO, InspectionStatus
from app.features.loss_management.upload_values import parse_irregularity
from app.main import app
from tests.test_loss_router import auth_headers, open_client

EXPORT_URL = "/api/v1/losses/inspections/export"
INSPECTIONS_URL = "/api/v1/losses/inspections"
RESULT_COLUMNS = (
    "data_inspecao",
    "inspetor",
    "irregularidade_constatada",
    "tipo_irregularidade",
    "kwh_recuperado",
    "numero_toi",
)


def make_order(id_inspecao: int, id_uc: str, **overrides) -> InspectionOrderDTO:
    fields = {
        "id_inspecao": id_inspecao,
        "id_uc": id_uc,
        "status": InspectionStatus.GERADA,
        "motivo": None,
        "kwh_estimado": 750.0,
        "fiscal_responsavel": None,
        "inspetor": None,
        "data_inspecao": None,
        "irregularidade_constatada": None,
        "tipo_irregularidade": None,
        "kwh_recuperado": None,
        "numero_toi": None,
        "justificativa_cancelamento": None,
        "motivo_cancelamento": None,
        "criado_por": "perdas@venergy.com",
        "criado_em": datetime(2026, 10, 21, 9, 30, tzinfo=UTC),
        "atualizado_em": datetime(2026, 10, 21, 9, 30, tzinfo=UTC),
    }
    return InspectionOrderDTO(**{**fields, **overrides})


def parse_export(content: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(content.lstrip("﻿")), delimiter=";"))


def test_csv_has_one_row_per_order_with_blank_result_columns():
    orders = [make_order(7, "UC-1"), make_order(8, "UC-2")]

    rows = parse_export(render_field_orders_csv(orders))

    assert list(rows[0].keys()) == list(EXPORT_COLUMNS)
    assert [row["id_inspecao"] for row in rows] == ["7", "8"]
    assert "fiscal_responsavel" not in rows[0]  # o fiscal de campo é o inspetor: uma coluna só
    assert all(row[column] == "" for row in rows for column in RESULT_COLUMNS)


def test_csv_keeps_field_data_already_saved_on_the_order():
    order = make_order(
        7,
        "UC-1",
        status=InspectionStatus.PENDENTE,
        inspetor="INSP-028",
        data_inspecao=date(2026, 10, 25),
        irregularidade_constatada=True,
        tipo_irregularidade="BY-PASS",
        kwh_recuperado=838.1,
        numero_toi="TOI-9",
    )

    row = parse_export(render_field_orders_csv([order]))[0]

    assert row["inspetor"] == "INSP-028"
    assert row["data_inspecao"] == "2026-10-25"
    assert parse_irregularity(row["irregularidade_constatada"]) is True
    assert row["tipo_irregularidade"] == "BY-PASS"
    assert row["kwh_recuperado"] == "838,1"
    assert row["numero_toi"] == "TOI-9"


def test_csv_writes_no_irregularity_as_a_value_the_upload_understands():
    row = parse_export(render_field_orders_csv([make_order(1, "UC-1", irregularidade_constatada=False)]))[0]

    assert parse_irregularity(row["irregularidade_constatada"]) is False


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


async def test_inspector_typed_in_the_old_fiscal_column_is_saved_as_inspetor(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    order_id = await create_order(client, headers, "UC_FRAUDE")
    lines = [
        "id_inspecao;fiscal_responsavel;data_inspecao;irregularidade_constatada",
        f"{order_id};INSP-028;2026-10-25;nao",
    ]
    files = {"file": ("retorno.csv", "\r\n".join(lines).encode("utf-8-sig"), "text/csv")}

    response = await client.post(f"{INSPECTIONS_URL}/upload", headers=headers, files=files)

    assert response.json()["conciliadas"] == 1
    order = next(o for o in (await client.get(INSPECTIONS_URL, headers=headers)).json() if o["id_inspecao"] == order_id)
    assert order["inspetor"] == "INSP-028"


async def test_export_returns_only_orders_that_go_to_field(client):
    headers = await auth_headers(client, "perdas@venergy.com")
    generated_id = await create_order(client, headers, "UC_FRAUDE")
    dispatched_id = await create_order(client, headers, "UC_ZERADA")
    dispatch = {"status": "pendente", "fiscal_responsavel": "Equipe 3"}
    await client.patch(f"{INSPECTIONS_URL}/{dispatched_id}", headers=headers, json=dispatch)
    cancelled_id = await create_order(client, headers, "UC_NORMAL")
    cancellation = {"status": "cancelada", "motivo_cancelamento": "ordem_duplicada"}
    await client.patch(f"{INSPECTIONS_URL}/{cancelled_id}", headers=headers, json=cancellation)

    response = await client.get(EXPORT_URL, headers=headers)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    assert ".csv" in response.headers["content-disposition"]
    rows = parse_export(response.text)
    assert sorted(int(row["id_inspecao"]) for row in rows) == sorted([generated_id, dispatched_id])
    assert {row["id_uc"] for row in rows} == {"UC_FRAUDE", "UC_ZERADA"}
