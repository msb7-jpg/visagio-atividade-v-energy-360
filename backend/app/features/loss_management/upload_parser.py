"""Leitura da planilha de retorno de campo (.csv ou .xlsx, várias abas) em linhas cruas (Pure Python)."""

import csv
import io
import zipfile
from collections.abc import Iterable, Iterator, Mapping
from dataclasses import dataclass
from pathlib import PurePath

from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException

from app.features.loss_management.upload_values import is_blank, normalize_header
from app.shared.exceptions import BadRequestException

KEY_COLUMN = "id_inspecao"
UNIT_COLUMN = "id_uc"
RESULT_COLUMN = "irregularidade_constatada"
# Nomes usados pela equipe de campo (inspecoes.xlsx real) e seus equivalentes na planilha exportada pelo portal.
COLUMN_ALIASES = {
    "data": "data_inspecao",
    "resultado": "irregularidade_constatada",
    "id_inspetor": "inspetor",
}
MAX_DATA_ROWS = 10_000
CSV_DELIMITERS = (";", ",", "\t")
UNSUPPORTED_TYPE_MESSAGE = "Formato não suportado: envie um arquivo .xlsx ou .csv."
XLSX_READ_ERRORS: tuple[type[Exception], ...] = (
    zipfile.BadZipFile,
    InvalidFileException,
    SyntaxError,  # xml.etree.ElementTree.ParseError (XML da aba corrompido) herda de SyntaxError
    KeyError,
    OSError,
    ValueError,
)
XLSX_INVALID_MESSAGE = "Arquivo .xlsx inválido ou corrompido."
MISSING_KEY_MESSAGE = (
    f"Coluna '{KEY_COLUMN}' (ou '{UNIT_COLUMN}' com a coluna de resultado) não encontrada: "
    "use a planilha exportada pelo portal."
)


@dataclass(frozen=True)
class RawRow:
    """Linha de dados da planilha, com colunas já normalizadas e valores como vieram."""

    sheet: str | None
    line: int
    cells: Mapping[str, object]


def read_spreadsheet(content: bytes, filename: str) -> list[RawRow]:
    """Lê todas as linhas de dados de um CSV ou de todas as abas de um XLSX.

    Args:
        content: Bytes do arquivo enviado.
        filename: Nome original, usado para escolher o formato pela extensão.

    Returns:
        Linhas não vazias das abas que têm a coluna `id_inspecao`, com o número da linha original.

    Raises:
        BadRequestException: Se o formato for desconhecido, o arquivo estiver corrompido, não tiver a coluna
            `id_inspecao` ou tiver linhas demais.
    """
    extension = PurePath(filename).suffix.lower()
    if extension == ".csv":
        return collect_rows(rows_from_csv(content))
    if extension == ".xlsx":
        return collect_rows(rows_from_xlsx(content))
    raise BadRequestException(UNSUPPORTED_TYPE_MESSAGE)


def collect_rows(rows: Iterator[RawRow]) -> list[RawRow]:
    """Materializa as linhas abortando na primeira que passa do limite, sem ler o arquivo todo."""
    collected: list[RawRow] = []
    for row in rows:
        if len(collected) >= MAX_DATA_ROWS:
            raise BadRequestException(f"Planilha com mais de {MAX_DATA_ROWS} linhas: divida o arquivo.")
        collected.append(row)
    return collected


def decode_csv(content: bytes) -> str:
    """Decodifica em UTF-8 (com ou sem BOM) ou, se falhar, no Windows-1252 típico do Excel antigo."""
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return content.decode("cp1252", errors="replace")


def rows_from_csv(content: bytes) -> Iterator[RawRow]:
    """Lê o CSV detectando o delimitador (`;`, `,` ou tab) pela linha de cabeçalho."""
    text = decode_csv(content)
    header_line = next((line for line in text.splitlines() if line.strip()), "")
    delimiter = max(CSV_DELIMITERS, key=header_line.count)
    reader = csv.reader(io.StringIO(text, newline=""), delimiter=delimiter)
    yield from rows_from_grid(None, reader)


def sheet_rows(worksheet) -> list[RawRow]:
    """Linhas de dados de uma aba; vazia quando ela não é uma aba de dados."""
    worksheet.reset_dimensions()  # alguns geradores declaram a dimensão errada (ex.: A1:A1)
    return list(rows_from_grid(worksheet.title, worksheet.iter_rows(values_only=True)))


def rows_from_xlsx(content: bytes) -> Iterator[RawRow]:
    """Lê cada aba do XLSX; abas sem a coluna `id_inspecao` (ex.: resumos) são ignoradas."""
    try:
        workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    except XLSX_READ_ERRORS as error:
        raise BadRequestException(XLSX_INVALID_MESSAGE) from error
    try:
        sheets_with_key_column: list[bool] = []
        for worksheet in workbook.worksheets:
            rows = sheet_rows(worksheet)
            yield from rows
            sheets_with_key_column.append(bool(rows) or has_key_header(worksheet))
        if not any(sheets_with_key_column):
            raise BadRequestException(MISSING_KEY_MESSAGE)
    except XLSX_READ_ERRORS as error:
        raise BadRequestException(XLSX_INVALID_MESSAGE) from error
    finally:
        workbook.close()


def has_key_header(worksheet) -> bool:
    """Indica se a primeira linha preenchida da aba é um cabeçalho de dados (mesmo sem linhas abaixo dele)."""
    for grid_row in worksheet.iter_rows(values_only=True):
        if not all(is_blank(cell) for cell in grid_row):
            return is_data_header(apply_aliases([normalize_header(cell) for cell in grid_row]))
    return False


def is_data_header(header: list[str]) -> bool:
    """Indica se o cabeçalho é de uma aba de dados: traz `id_inspecao` ou `id_uc` junto com o resultado.

    O `id_uc` sozinho não basta, para abas de resumo com uma coluna de UC não virarem linhas de dados.
    """
    return KEY_COLUMN in header or (UNIT_COLUMN in header and RESULT_COLUMN in header)


def apply_aliases(header: list[str]) -> list[str]:
    """Troca os nomes de coluna do campo pelos do portal, sem sobrescrever uma coluna que já existe no arquivo."""
    present = set(header)
    return [
        COLUMN_ALIASES[name] if name in COLUMN_ALIASES and COLUMN_ALIASES[name] not in present else name
        for name in header
    ]


def rows_from_grid(sheet: str | None, grid: Iterable[Iterable[object]]) -> Iterator[RawRow]:
    """Transforma uma grade (CSV ou aba) em linhas nomeadas pelo cabeçalho, pulando as vazias.

    Raises:
        BadRequestException: Se for um CSV (`sheet` None) cujo cabeçalho não traz `id_inspecao` nem `id_uc`.
    """
    header: list[str] | None = None
    for line_number, grid_row in enumerate(grid, start=1):
        values = list(grid_row)
        if all(is_blank(cell) for cell in values):
            continue
        if header is None:
            header = apply_aliases([normalize_header(cell) for cell in values])
            if not is_data_header(header):
                if sheet is None:
                    raise BadRequestException(MISSING_KEY_MESSAGE)
                return
            continue
        cells = {name: cell for name, cell in zip(header, values, strict=False) if name}
        yield RawRow(sheet=sheet, line=line_number, cells=cells)
