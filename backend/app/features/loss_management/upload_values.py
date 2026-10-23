"""Normalização dos valores digitados em campo na planilha de retorno (Pure Python)."""

import math
import re
import unicodedata
from datetime import date, datetime

# Com hífen o campo escreve mês-dia-ano ("09-25-2025"; inspecoes.xlsx real: 33 de 46 datas têm o 2º número > 12 e
# nenhuma tem o 1º). "%d-%m-%Y" fica por último só para as datas sem ambiguidade ("14-08-2025").
DATE_FORMATS = ("%Y-%m-%d", "%d.%m.%Y", "%m-%d-%Y", "%d-%m-%Y", "%d/%m/%Y")
NEGATIVE_WORDS = frozenset({"nao", "n", "nada", "sem", "improcedente", "regular"})
POSITIVE_WORDS = frozenset({"sim", "s", "confirmada", "confirmado", "irregular", "irregularidade"})
THOUSANDS_ONLY = re.compile(r"\d{1,3}(\.\d{3})+")
NUMERIC_TEXT = re.compile(r"-?[\d.,]+")


class InvalidValueError(ValueError):
    """Valor da planilha que não pôde ser interpretado; a mensagem começa pelo nome da coluna."""


def strip_accents(text: str) -> str:
    """Remove acentos e passa para minúsculas."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(char for char in decomposed if not unicodedata.combining(char)).lower()


def normalize_header(raw: object) -> str:
    """Converte o título de coluna para snake_case sem acentos (`ID Inspeção` -> `id_inspecao`).

    Args:
        raw: Valor da célula de cabeçalho.

    Returns:
        O nome normalizado, ou vazio se a célula estiver em branco.
    """
    if raw is None:
        return ""
    return re.sub(r"[^a-z0-9]+", "_", strip_accents(str(raw))).strip("_")


def is_blank(raw: object) -> bool:
    """Indica célula vazia ou só com espaços."""
    return raw is None or (isinstance(raw, str) and not raw.strip())


def parse_irregularity(raw: object) -> bool | None:
    """Interpreta o resultado de campo ("CONFIRMADA", "NADA CONSTA", "sim", "não"...).

    Args:
        raw: Valor da célula `irregularidade_constatada`.

    Returns:
        True/False, ou None se a equipe não preencheu.

    Raises:
        InvalidValueError: Se o texto não for reconhecido.
    """
    if isinstance(raw, bool):
        return raw
    if is_blank(raw):
        return None
    words = set(re.findall(r"[a-z]+", strip_accents(str(raw))))
    if words & NEGATIVE_WORDS:
        return False
    if words & POSITIVE_WORDS:
        return True
    raise InvalidValueError(f"irregularidade_constatada: valor '{raw}' não reconhecido.")


def parse_field_date(raw: object) -> date | None:
    """Interpreta a data da inspeção (`2025-08-01`, `14.08.2025`, `09-25-2025`, data do Excel).

    Com hífen a data é mês-dia-ano; `09-01-2025` é 1º de setembro. Pontos e barras são dia-mês-ano.

    Args:
        raw: Valor da célula `data_inspecao`.

    Returns:
        A data, ou None se estiver em branco.

    Raises:
        InvalidValueError: Se a data não existir ou estiver em formato desconhecido.
    """
    if is_blank(raw):
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    date_text = str(raw).strip().split()[0]
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(date_text, date_format).date()
        except ValueError:
            continue
    raise InvalidValueError(f"data_inspecao: data '{raw}' inválida.")


def to_decimal_text(cleaned: str) -> str:
    """Converte "1.234,56", "1,234.56", "1.234" ou "0,5" para o formato aceito por `float`."""
    has_comma, has_dot = "," in cleaned, "." in cleaned
    if has_comma and has_dot:
        decimal_separator = "," if cleaned.rfind(",") > cleaned.rfind(".") else "."
        thousands_separator = "." if decimal_separator == "," else ","
        return cleaned.replace(thousands_separator, "").replace(decimal_separator, ".")
    if has_comma:
        return cleaned.replace(",", ".") if cleaned.count(",") == 1 else "x"
    if has_dot and THOUSANDS_ONLY.fullmatch(cleaned):
        return cleaned.replace(".", "")
    return cleaned


def number_from_cell(raw: object) -> float:
    """Converte a célula (número ou texto com "kWh", vírgula/ponto decimal e milhar) em `float`.

    Raises:
        InvalidValueError: Se o texto não for numérico.
    """
    if isinstance(raw, int | float) and not isinstance(raw, bool):
        return float(raw)
    cleaned = re.sub(r"kwh", "", str(raw), flags=re.IGNORECASE).replace(" ", "")
    if not NUMERIC_TEXT.fullmatch(cleaned):
        raise InvalidValueError(f"kwh_recuperado: valor '{raw}' não é numérico.")
    try:
        return float(to_decimal_text(cleaned))
    except ValueError as error:
        raise InvalidValueError(f"kwh_recuperado: valor '{raw}' não é numérico.") from error


def parse_kwh(raw: object) -> float | None:
    """Interpreta a energia recuperada, com vírgula ou ponto decimal e separador de milhar.

    Args:
        raw: Valor da célula `kwh_recuperado`.

    Returns:
        O valor em kWh, ou None se estiver em branco.

    Raises:
        InvalidValueError: Se não for um número finito e não negativo.
    """
    if is_blank(raw):
        return None
    value = number_from_cell(raw)
    if not math.isfinite(value) or value < 0:
        raise InvalidValueError(f"kwh_recuperado: valor '{raw}' deve ser um número não negativo.")
    return value
