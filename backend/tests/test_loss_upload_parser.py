import io
import re
import zipfile

import pytest
from openpyxl import Workbook

from app.features.loss_management.schemas import InspectionStatus
from app.features.loss_management.service import LossService
from app.features.loss_management.upload_parser import MAX_DATA_ROWS, read_spreadsheet
from app.features.loss_management.upload_reconcile import reconcile_rows
from app.shared.exceptions import BadRequestException

CSV_HEADER = "id_inspecao;data_inspecao;irregularidade_constatada;tipo_irregularidade;kwh_recuperado;numero_toi"


def csv_bytes(*lines: str, encoding: str = "utf-8-sig") -> bytes:
    return "\r\n".join([CSV_HEADER, *lines]).encode(encoding)


def xlsx_bytes(sheets: dict[str, list[list[object]]]) -> bytes:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, sheet_rows in sheets.items():
        worksheet = workbook.create_sheet(sheet_name)
        for sheet_row in sheet_rows:
            worksheet.append(sheet_row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def test_reads_csv_exported_by_the_portal_with_bom_and_semicolon():
    content = csv_bytes("7;14.08.2025;CONFIRMADA;by-pass;1.234,5;TOI-1")

    rows = read_spreadsheet(content, "retorno.csv")

    assert len(rows) == 1
    assert rows[0].cells["id_inspecao"] == "7"
    assert rows[0].cells["kwh_recuperado"] == "1.234,5"
    assert rows[0].line == 2


def test_reads_csv_with_comma_delimiter_and_latin1_encoding():
    content = "ID Inspeção,Irregularidade Constatada\n9,NÃO".encode("cp1252")

    rows = read_spreadsheet(content, "retorno.CSV")

    assert rows[0].cells == {"id_inspecao": "9", "irregularidade_constatada": "NÃO"}


def test_reads_every_sheet_of_a_workbook_and_skips_sheets_without_the_key_column():
    content = xlsx_bytes({
        "Equipe 1": [["id_inspecao", "kWh Recuperado"], [1, 10.5]],
        "Equipe 2": [["ID Inspeção", "kWh Recuperado"], [2, "7,5"], [None, None], [3, 1]],
        "Resumo": [["total"], [3]],
    })

    rows = read_spreadsheet(content, "retorno.xlsx")

    assert [(row.sheet, row.line, row.cells["id_inspecao"]) for row in rows] == [
        ("Equipe 1", 2, 1),
        ("Equipe 2", 2, 2),
        ("Equipe 2", 4, 3),
    ]


@pytest.mark.parametrize("filename", ["retorno.pdf", "retorno", "retorno.xls"])
def test_rejects_unsupported_file_types(filename):
    with pytest.raises(BadRequestException, match="xlsx"):
        read_spreadsheet(b"x", filename)


def test_rejects_file_without_the_key_column():
    with pytest.raises(BadRequestException, match="id_inspecao"):
        read_spreadsheet(b"a;b\r\n1;2", "retorno.csv")


def test_rejects_corrupted_workbook():
    with pytest.raises(BadRequestException, match="xlsx"):
        read_spreadsheet(b"not a zip", "retorno.xlsx")


def reconcile(*lines: str, active_ids: tuple[int, ...] = (1, 2, 3), statuses: dict | None = None):
    orders = statuses or dict.fromkeys(active_ids, InspectionStatus.PENDENTE)
    return reconcile_rows(read_spreadsheet(csv_bytes(*lines), "retorno.csv"), orders)


def test_confirmed_irregularity_becomes_a_completed_update():
    plan = reconcile("1;2025-08-01;irregularidade confirmada;By-pass;1.200,5;TOI-9")

    update = plan.updates[1]
    assert update.status == InspectionStatus.CONCLUIDA
    assert update.irregularidade_constatada is True
    assert update.kwh_recuperado == pytest.approx(1200.5)
    assert update.tipo_irregularidade == "By-pass"
    assert update.numero_toi == "TOI-9"
    assert plan.rejections == []


def test_generated_orders_can_also_be_completed_from_the_field_sheet():
    plan = reconcile("1;;NADA CONSTA;;;", statuses={1: InspectionStatus.GERADA})

    assert plan.updates[1].irregularidade_constatada is False


def test_blank_result_rows_are_ignored_not_rejected():
    plan = reconcile("1;;;;;", "2;;;;;")

    assert plan.updates == {}
    assert plan.rejections == []
    assert plan.ignored == 2


def test_invalid_rows_are_rejected_with_reason_without_stopping_the_batch():
    plan = reconcile(
        "1;;sim;;abc;",
        "999;;sim;;;",
        "abc;;sim;;;",
        "2;;talvez;;;",
        "3;31.02.2025;sim;;;",
        "1;;sim;;50;",
    )

    assert set(plan.updates) == {1}
    reasons = {rejection.linha: rejection.motivo for rejection in plan.rejections}
    assert "kwh_recuperado" in reasons[2]
    assert "não encontrada" in reasons[3]
    assert "id_inspecao" in reasons[4]
    assert "irregularidade_constatada" in reasons[5]
    assert "data_inspecao" in reasons[6]
    assert plan.rejections[0].id_inspecao == 1


def test_duplicate_id_in_the_same_file_is_rejected():
    plan = reconcile("1;;sim;;10;", "1;;nao;;;")

    assert plan.updates[1].irregularidade_constatada is True
    assert "duplicada" in plan.rejections[0].motivo


@pytest.mark.parametrize("status", [InspectionStatus.CONCLUIDA, InspectionStatus.CANCELADA])
def test_orders_that_already_left_the_field_flow_are_rejected(status):
    plan = reconcile("1;;sim;;10;", statuses={1: status})

    assert plan.updates == {}
    assert status.value in plan.rejections[0].motivo


def test_recovered_energy_without_irregularity_is_contradictory():
    plan = reconcile("1;;NADA CONSTA;;300;")

    assert plan.updates == {}
    assert "kwh_recuperado" in plan.rejections[0].motivo


@pytest.mark.parametrize("raw_id", ["1.0", "1,0", " 1 "])
def test_order_id_tolerates_decimal_text_written_by_other_tools(raw_id):
    plan = reconcile(f"{raw_id};;sim;;10;")

    assert set(plan.updates) == {1}


def test_negative_result_tolerates_zero_kwh_and_prefilled_details():
    plan = reconcile("1;;NADA CONSTA;by-pass;0,00;TOI-1")

    update = plan.updates[1]
    assert update.irregularidade_constatada is False
    assert update.kwh_recuperado is None
    assert update.tipo_irregularidade is None
    assert update.numero_toi is None


def test_duplicate_rejection_says_the_first_value_was_kept():
    plan = reconcile("1;;sim;;10;", "1;;nao;;;")

    assert "primeira ocorrência" in plan.rejections[0].motivo


def test_file_over_the_row_limit_is_rejected():
    lines = [f"{index};;sim;;1;" for index in range(1, MAX_DATA_ROWS + 2)]

    with pytest.raises(BadRequestException, match="linhas"):
        read_spreadsheet(csv_bytes(*lines), "retorno.csv")


def declare_wrong_dimension(xlsx_content: bytes) -> bytes:
    rewritten = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(xlsx_content)) as source, zipfile.ZipFile(rewritten, "w") as target:
        for entry in source.infolist():
            data = source.read(entry.filename)
            if entry.filename == "xl/worksheets/sheet1.xml":
                data = re.sub(rb'<dimension ref="[^"]*"', b'<dimension ref="A1:A1"', data)
            target.writestr(entry, data)
    return rewritten.getvalue()


def test_sheet_with_wrong_declared_dimension_is_fully_read():
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["id_inspecao", "kwh_recuperado"])
    worksheet.append([1, 5])
    worksheet.append([2, 6])
    saved = io.BytesIO()
    workbook.save(saved)

    rows = read_spreadsheet(declare_wrong_dimension(saved.getvalue()), "retorno.xlsx")

    assert [row.cells["id_inspecao"] for row in rows] == [1, 2]


class StubRepository:
    """Simula uma ordem que saiu do fluxo de campo entre a validação e a gravação."""

    async def get_order_statuses(self, ids):
        return dict.fromkeys(ids, InspectionStatus.PENDENTE)

    async def apply_field_results(self, updates):
        return []


async def test_order_that_left_field_flow_during_upload_is_reported_as_rejected():
    service = LossService(repository=StubRepository())

    result = await service.upload_field_results(csv_bytes("1;;sim;;10;"), "retorno.csv")

    assert result.conciliadas == 0
    assert result.kwh_recuperado_total == pytest.approx(0)
    assert (result.rejeitadas[0].linha, result.rejeitadas[0].id_inspecao) == (2, 1)

