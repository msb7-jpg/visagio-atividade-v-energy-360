"""Comparador semântico determinístico de resultados de consultas SQL analíticas."""

import math
from itertools import starmap
from typing import Any

from app.core.constants import QueryResultRow


def _normalize_cell_value(value: Any) -> Any:
    """Normaliza um valor individual para comparação semântica e tolerância numérica."""
    if value is None:
        return None
    if isinstance(value, float):
        return round(value, 2)
    if isinstance(value, int):
        return float(value)
    if isinstance(value, str):
        trimmed = value.strip().upper()
        try:
            return float(trimmed)
        except ValueError:
            return trimmed
    return value


def _cells_are_equivalent(actual_val: Any, expected_val: Any) -> bool:
    """Verifica se duas células são equivalentes com tolerância numérica."""
    norm_actual = _normalize_cell_value(actual_val)
    norm_expected = _normalize_cell_value(expected_val)

    if norm_actual is None or norm_expected is None:
        return norm_actual is norm_expected

    if isinstance(norm_actual, (float, int)) and isinstance(norm_expected, (float, int)):
        return math.isclose(float(norm_actual), float(norm_expected), rel_tol=1e-3, abs_tol=0.05)

    return bool(norm_actual == norm_expected)


def _row_to_value_tuple(row: QueryResultRow) -> tuple[Any, ...]:
    """Extrai uma tupla ordenada de valores de uma linha."""
    return tuple(_normalize_cell_value(row[column_name]) for column_name in sorted(row.keys()))


def _tuples_match(tuple_actual: tuple[Any, ...], tuple_expected: tuple[Any, ...]) -> bool:
    """Verifica se duas tuplas possuem os mesmos valores em correspondência."""
    if len(tuple_actual) != len(tuple_expected):
        return False
    return all(starmap(_cells_are_equivalent, zip(tuple_actual, tuple_expected, strict=False)))


def _compare_scalar_results(
    actual_rows: list[QueryResultRow],
    expected_rows: list[QueryResultRow],
) -> tuple[bool, str | None] | None:
    """Compara caso especial mono-valor escalar (SUM, COUNT, AVG). Retorna None se não for escalar."""
    if len(actual_rows) != 1 or len(expected_rows) != 1:
        return None
    first_actual_values = list(actual_rows[0].values())
    first_expected_values = list(expected_rows[0].values())
    if len(first_actual_values) != 1 or len(first_expected_values) != 1:
        return None

    if _cells_are_equivalent(first_actual_values[0], first_expected_values[0]):
        return True, None
    return (
        False,
        f"Valor escalar divergente: obtido {first_actual_values[0]} vs esperado {first_expected_values[0]}.",
    )


def _compare_ordered_tuples(
    actual_tuples: list[tuple[Any, ...]],
    expected_tuples: list[tuple[Any, ...]],
) -> tuple[bool, str | None]:
    """Compara sequências de tuplas em ordem estrita."""
    for row_index, (act_tup, exp_tup) in enumerate(zip(actual_tuples, expected_tuples, strict=False)):
        if not _tuples_match(act_tup, exp_tup):
            return False, f"Divergência na linha {row_index}: {act_tup} != {exp_tup}."
    return True, None


def _compare_multiset_tuples(
    actual_tuples: list[tuple[Any, ...]],
    expected_tuples: list[tuple[Any, ...]],
) -> tuple[bool, str | None]:
    """Compara conjuntos de tuplas como multiconjunto agnóstico de ordem."""
    unmatched_expected = list(expected_tuples)
    for act_tup in actual_tuples:
        matched_idx = next(
            (idx for idx, exp_tup in enumerate(unmatched_expected) if _tuples_match(act_tup, exp_tup)),
            None,
        )
        if matched_idx is not None:
            unmatched_expected.pop(matched_idx)
        else:
            return False, f"Linha obtida {act_tup} não encontrada no resultado esperado."

    return len(unmatched_expected) == 0, None


def compare_query_results(
    actual_rows: list[QueryResultRow] | None,
    expected_rows: list[QueryResultRow] | None,
    strict_order: bool = False,
) -> tuple[bool, str | None]:
    """
    Compara o resultado retornado pelo agente contra o resultado esperado no SQLite.

    Args:
        actual_rows: Linhas retornadas pela query do agente.
        expected_rows: Linhas retornadas pela query canônica esperada.
        strict_order: Se True, exige correspondência estrita na ordem das linhas.

    Returns:
        Tupla (matched, reason_if_mismatch).
    """
    if actual_rows is None or expected_rows is None:
        if actual_rows is None and expected_rows is None:
            return True, None
        return False, "Um dos conjuntos de resultados é nulo."

    if len(actual_rows) != len(expected_rows):
        return (
            False,
            f"Quantidade de linhas divergente (obtido: {len(actual_rows)}, esperado: {len(expected_rows)}).",
        )

    if not actual_rows and not expected_rows:
        return True, None

    scalar_result = _compare_scalar_results(actual_rows, expected_rows)
    if scalar_result is not None:
        return scalar_result

    actual_tuples = [_row_to_value_tuple(row) for row in actual_rows]
    expected_tuples = [_row_to_value_tuple(row) for row in expected_rows]

    if strict_order:
        return _compare_ordered_tuples(actual_tuples, expected_tuples)
    return _compare_multiset_tuples(actual_tuples, expected_tuples)

