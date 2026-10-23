"""Geração da planilha CSV de ordens de inspeção que seguem para a equipe de campo (Pure Python)."""

import csv
import io
from collections.abc import Sequence

from app.features.loss_management.schemas import InspectionOrderDTO

CSV_DELIMITER = ";"  # o Excel em pt-BR usa ';' como separador de lista
UTF8_BOM = "﻿"  # faz o Excel reconhecer os acentos
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")

PREFILLED_COLUMNS = (
    "id_inspecao",
    "id_uc",
    "status",
    "motivo",
    "kwh_estimado",
    "fiscal_responsavel",
    "criado_em",
)
FIELD_RESULT_COLUMNS = (
    "data_inspecao",
    "irregularidade_constatada",
    "tipo_irregularidade",
    "kwh_recuperado",
    "numero_toi",
)
EXPORT_COLUMNS = PREFILLED_COLUMNS + FIELD_RESULT_COLUMNS


def neutralize_formula(text: str) -> str:
    """Impede que o texto seja interpretado como fórmula ao abrir a planilha.

    Args:
        text: Texto livre digitado por um usuário (motivo, fiscal, UC).

    Returns:
        O mesmo texto, com apóstrofo à frente se começar com caractere de fórmula.
    """
    return f"'{text}" if text.startswith(FORMULA_PREFIXES) else text


def format_kwh(kwh: float) -> str:
    """Formata o kWh com uma casa e vírgula decimal, sem notação científica, como as planilhas pt-BR esperam."""
    return f"{kwh:.1f}".replace(".", ",")


def build_export_row(order: InspectionOrderDTO) -> list[str]:
    """Monta a linha da planilha: dados da ordem preenchidos e colunas de retorno em branco.

    Args:
        order: Ordem de inspeção a ser despachada.

    Returns:
        Valores na ordem de `EXPORT_COLUMNS`.
    """
    prefilled_values = [
        str(order.id_inspecao),
        neutralize_formula(order.id_uc),
        order.status.value,
        neutralize_formula(order.motivo or ""),
        format_kwh(order.kwh_estimado),
        neutralize_formula(order.fiscal_responsavel or ""),
        order.criado_em.isoformat(),
    ]
    blank_result_values = [""] * len(FIELD_RESULT_COLUMNS)
    return prefilled_values + blank_result_values


def render_field_orders_csv(orders: Sequence[InspectionOrderDTO]) -> str:
    """Gera o CSV que a equipe de campo preenche com o resultado das inspeções.

    O `id_inspecao` identifica cada linha para conciliar o arquivo devolvido (upload).

    Args:
        orders: Ordens a despachar.

    Returns:
        Conteúdo do CSV com BOM UTF-8, cabeçalho e uma linha por ordem.
    """
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=CSV_DELIMITER, lineterminator="\r\n")
    writer.writerow(EXPORT_COLUMNS)
    writer.writerows(build_export_row(order) for order in orders)
    return UTF8_BOM + buffer.getvalue()
