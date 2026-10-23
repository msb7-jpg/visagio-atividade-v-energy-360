"""Regras puras de interpretação do que o atendente digita na busca da Visão 360."""

import re
from dataclasses import dataclass

UC_PREFIX = "UC"
METER_PREFIX = "MD"
MIN_SEARCH_LENGTH = 3
SEPARATORS = re.compile(r"[\s\-_./]")


@dataclass(frozen=True, slots=True)
class PrefixRange:
    """Intervalo [inicio, fim) que equivale a "começa com" e aproveita o índice do banco."""

    start: str
    end: str


def compact_term(typed_text: str) -> str:
    """Remove espaços e separadores e coloca em caixa alta.

    Args:
        typed_text: Texto digitado, ex: ` uc-100 004 `.

    Returns:
        Texto compacto, ex: `UC100004`.
    """
    return SEPARATORS.sub("", typed_text).upper()


def normalize_id_uc(typed_text: str) -> str:
    """Converte o número digitado no formato do cadastro, aceitando só os dígitos.

    Args:
        typed_text: Número como digitado, ex: `100004`, `uc 100004` ou `UC-100004`.

    Returns:
        Identificador no formato do cadastro, ex: `UC100004`.
    """
    compact = compact_term(typed_text)
    return f"{UC_PREFIX}{compact}" if compact.isdigit() else compact


def normalize_meter(typed_text: str) -> str:
    """Converte o número do medidor digitado no formato do cadastro, aceitando só os dígitos.

    Args:
        typed_text: Número do medidor como digitado, ex: `500004` ou `md 500004`.

    Returns:
        Número do medidor no formato do cadastro, ex: `MD500004`.
    """
    compact = compact_term(typed_text)
    return f"{METER_PREFIX}{compact}" if compact.isdigit() else compact


def prefix_range(prefix: str) -> PrefixRange:
    """Monta o intervalo de comparação equivalente a "começa com `prefix`".

    Args:
        prefix: Começo do texto procurado (não vazio).

    Returns:
        Intervalo cujo fim é o prefixo com o último caractere incrementado.
    """
    next_character = chr(ord(prefix[-1]) + 1)
    return PrefixRange(start=prefix, end=f"{prefix[:-1]}{next_character}")


def is_searchable(typed_text: str) -> bool:
    """Indica se o texto tem tamanho mínimo para sugerir UCs sem devolver o cadastro inteiro.

    Args:
        typed_text: Texto digitado.

    Returns:
        True com pelo menos `MIN_SEARCH_LENGTH` caracteres úteis.
    """
    return len(compact_term(typed_text)) >= MIN_SEARCH_LENGTH
