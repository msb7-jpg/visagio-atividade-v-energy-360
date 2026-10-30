"""Verificador determinístico de fidelidade factual numérica (Anti-Alucinação)."""

import math
import re
from typing import Any

# Anos do escopo e inteiros triviais ignorados como alegações factuais estritas
IGNORED_NUMBERS = {2022, 2023, 2024, 2025, 2026, 1, 2, 3, 4, 5, 10, 12, 30}


def _extract_numbers_from_text(text: str) -> list[float]:
    """
    Extrai valores numéricos de um texto em português brasileiro ou internacional.
    Suporta formatos como: 172.232.176,56 / 85,4% / -5.12 / 367963.
    """
    cleaned = re.sub(r"\b(202[2-6]|12|30)\b", " ", text)
    matches = re.findall(r"[-+]?\d+(?:[.,]\d+)*", cleaned)

    extracted_values: list[float] = []
    for match_str in matches:
        raw_token = match_str.strip()
        if not raw_token or raw_token in ("-", "+"):
            continue

        if "." in raw_token and "," in raw_token:
            if raw_token.rfind(",") > raw_token.rfind("."):
                raw_token = raw_token.replace(".", "").replace(",", ".")
            else:
                raw_token = raw_token.replace(",", "")
        elif "," in raw_token:
            raw_token = raw_token.replace(",", ".")
        elif raw_token.count(".") > 1:
            raw_token = raw_token.replace(".", "")

        try:
            val_float = float(raw_token)
            if int(val_float) in IGNORED_NUMBERS and abs(val_float - int(val_float)) < 1e-5:
                continue
            extracted_values.append(abs(val_float))
        except ValueError:
            continue

    return extracted_values


def _collect_reference_numbers(data: Any) -> list[float]:
    """Coleta recursivamente todos os valores numéricos de listas de dicionários ou mapas."""
    collected: list[float] = []
    if isinstance(data, (int, float)):
        collected.append(abs(float(data)))
    elif isinstance(data, dict):
        for dict_value in data.values():
            collected.extend(_collect_reference_numbers(dict_value))
    elif isinstance(data, (list, tuple)):
        for list_element in data:
            collected.extend(_collect_reference_numbers(list_element))
    elif isinstance(data, str):
        collected.extend(_extract_numbers_from_text(data))
    return collected


def _number_is_grounded(target_val: float, reference_pool: list[float]) -> bool:
    """Verifica se um número tem correspondência no conjunto de referência."""
    for ref_num in reference_pool:
        # Match direto ou com tolerância de 2%
        if math.isclose(target_val, ref_num, rel_tol=0.02, abs_tol=0.1):
            return True

        # Suporte a grandezas proporcionais (ex: 172.23 milhões vs 172232176, ou percentual 0.0512 vs 5.12)
        if ref_num > 0 and target_val > 0:
            ratio = target_val / ref_num
            for scale in (0.01, 100.0, 1e-3, 1e3, 1e-6, 1e6):
                if math.isclose(ratio, scale, rel_tol=0.02):
                    return True

    return False


def check_numerical_faithfulness(
    generated_text: str,
    reference_data: Any,
) -> tuple[bool, float, list[float]]:
    """
    Verifica se todos os números citados no texto gerado possuem respaldo nos dados brutos.

    Args:
        generated_text: Texto ou Markdown emitido pelo modelo.
        reference_data: Linhas retornadas do SQLite ou dicionário de métricas do painel.

    Returns:
        Tupla (is_faithful, grounded_ratio, ungrounded_numbers).
    """
    if not generated_text:
        return True, 1.0, []

    cited_numbers = _extract_numbers_from_text(generated_text)
    if not cited_numbers:
        return True, 1.0, []

    ref_numbers = _collect_reference_numbers(reference_data)
    if not ref_numbers:
        # Se o texto cita números mas os dados não contêm números, é infiel
        return False, 0.0, cited_numbers

    ungrounded_list: list[float] = []
    grounded_count = 0

    for num in cited_numbers:
        if _number_is_grounded(num, ref_numbers):
            grounded_count += 1
        else:
            ungrounded_list.append(num)

    grounded_ratio = grounded_count / len(cited_numbers)
    # Considerado fiel se pelo menos 90% das alegações numéricas forem comprovadas
    is_faithful = bool(grounded_ratio >= 0.90 or len(ungrounded_list) == 0)

    return is_faithful, round(grounded_ratio, 2), ungrounded_list
