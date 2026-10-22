"""Conciliação das linhas da planilha de campo com as ordens de inspeção ativas (Pure Python)."""

import re
from collections.abc import Mapping, Sequence
from contextlib import suppress
from dataclasses import dataclass

from pydantic import ValidationError

from app.features.loss_management.schemas import InspectionOrderUpdateDTO, InspectionStatus, RejectedRowDTO
from app.features.loss_management.update_rules import ensure_fields_match_status, ensure_required_fields
from app.features.loss_management.upload_parser import KEY_COLUMN, RawRow
from app.features.loss_management.upload_values import (
    InvalidValueError,
    is_blank,
    parse_field_date,
    parse_irregularity,
    parse_kwh,
)
from app.shared.exceptions import BadRequestException

FIELD_ACTIVE_STATUSES = frozenset({InspectionStatus.GERADA, InspectionStatus.PENDENTE})
INTEGER_TEXT = re.compile(r"(\d+)(?:[.,]0+)?")  # "15", "15.0" e "15,0" (CSV regravado por outra ferramenta)
RESULT_COLUMNS = ("data_inspecao", "irregularidade_constatada", "tipo_irregularidade", "kwh_recuperado", "numero_toi")
REJECTABLE_ERRORS = (InvalidValueError, BadRequestException, ValidationError)


@dataclass(frozen=True)
class ReconciliationPlan:
    """Resultado da conciliação: o que aplicar, o que foi recusado e quantas linhas ainda estão sem resultado."""

    updates: dict[int, InspectionOrderUpdateDTO]
    origins: dict[int, RawRow]
    rejections: list[RejectedRowDTO]
    ignored: int


def parse_order_id(raw: object) -> int:
    """Lê o `id_inspecao` da célula (texto, inteiro ou decimal inteiro do Excel).

    Raises:
        InvalidValueError: Se não for um inteiro positivo.
    """
    candidate = raw.strip() if isinstance(raw, str) else raw
    if isinstance(candidate, float) and candidate.is_integer():
        candidate = int(candidate)
    integer_match = INTEGER_TEXT.fullmatch(candidate) if isinstance(candidate, str) else None
    if integer_match:
        candidate = int(integer_match.group(1))
    if isinstance(candidate, bool) or not isinstance(candidate, int) or candidate <= 0:
        raise InvalidValueError(f"{KEY_COLUMN}: valor '{raw}' inválido.")
    return candidate


def referenced_order_ids(rows: Sequence[RawRow]) -> set[int]:
    """Identificadores de ordem citados na planilha, ignorando as células de id inválidas."""
    order_ids: set[int] = set()
    for row in rows:
        with suppress(InvalidValueError):
            order_ids.add(parse_order_id(row.cells.get(KEY_COLUMN)))
    return order_ids


def text_or_none(raw: object) -> str | None:
    """Texto sem espaços nas pontas; números inteiros do Excel viram texto sem `.0`."""
    if is_blank(raw):
        return None
    if isinstance(raw, float) and raw.is_integer():
        return str(int(raw))
    return str(raw).strip()


def describe_rejection(error: Exception) -> str:
    """Extrai a mensagem de recusa legível de qualquer erro de validação da linha."""
    if isinstance(error, BadRequestException):
        return error.message
    if isinstance(error, ValidationError):
        first_error = error.errors()[0]
        return f"{first_error['loc'][0]}: {first_error['msg']}"
    return str(error)


def ensure_order_accepts_result(order_id: int, status: InspectionStatus | None) -> None:
    """Garante que a ordem existe e ainda está em campo (gerada ou pendente).

    Raises:
        InvalidValueError: Se a ordem não existir ou já estiver concluída/cancelada.
    """
    if status is None:
        raise InvalidValueError(f"Ordem {order_id} não encontrada no portal.")
    if status not in FIELD_ACTIVE_STATUSES:
        raise InvalidValueError(f"Ordem {order_id} já está '{status.value}' e não aceita resultado de campo.")


def build_update(row: RawRow) -> InspectionOrderUpdateDTO | None:
    """Converte o resultado preenchido em campo numa conclusão de ordem.

    Returns:
        A atualização `concluida`, ou None se a linha não traz nenhum resultado.

    Raises:
        InvalidValueError | BadRequestException | ValidationError: Se algum valor for inválido ou contraditório.
    """
    cells = row.cells
    if all(is_blank(cells.get(column)) for column in RESULT_COLUMNS):
        return None
    irregularity = parse_irregularity(cells.get("irregularidade_constatada"))
    parse_field_date(cells.get("data_inspecao"))  # valida o formato; a ordem não guarda a data
    kwh_recovered = parse_kwh(cells.get("kwh_recuperado"))
    if irregularity is None:
        raise InvalidValueError("irregularidade_constatada: preencha o resultado da inspeção.")
    if irregularity is False and not kwh_recovered:
        kwh_recovered = None  # 0 kWh é o valor natural de "nada consta"
    has_details = irregularity is True
    update = InspectionOrderUpdateDTO(
        status=InspectionStatus.CONCLUIDA,
        fiscal_responsavel=text_or_none(cells.get("fiscal_responsavel")),
        irregularidade_constatada=irregularity,
        tipo_irregularidade=text_or_none(cells.get("tipo_irregularidade")) if has_details else None,
        kwh_recuperado=kwh_recovered,
        numero_toi=text_or_none(cells.get("numero_toi")) if has_details else None,
    )
    ensure_required_fields(update)
    ensure_fields_match_status(update)
    return update


def reconcile_rows(rows: Sequence[RawRow], order_statuses: Mapping[int, InspectionStatus]) -> ReconciliationPlan:
    """Concilia cada linha com a ordem de mesmo `id_inspecao` sem abortar o lote por uma linha inválida.

    Args:
        rows: Linhas lidas da planilha.
        order_statuses: Status atual das ordens citadas na planilha (ausente = ordem inexistente).

    Returns:
        As atualizações a aplicar (uma por ordem), as linhas recusadas com motivo e a contagem de linhas
        sem resultado preenchido.
    """
    updates: dict[int, InspectionOrderUpdateDTO] = {}
    origins: dict[int, RawRow] = {}
    rejections: list[RejectedRowDTO] = []
    ignored = 0
    for row in rows:
        order_id: int | None = None
        try:
            order_id = parse_order_id(row.cells.get(KEY_COLUMN))
            update = build_update(row)
            if update is None:
                ignored += 1
                continue
            ensure_order_accepts_result(order_id, order_statuses.get(order_id))
            if order_id in updates:
                raise InvalidValueError(
                    f"Linha duplicada: a ordem {order_id} já foi conciliada neste arquivo; "
                    "o valor da primeira ocorrência foi mantido."
                )
            updates[order_id] = update
            origins[order_id] = row
        except REJECTABLE_ERRORS as error:
            rejections.append(
                RejectedRowDTO(aba=row.sheet, linha=row.line, id_inspecao=order_id, motivo=describe_rejection(error))
            )
    return ReconciliationPlan(updates=updates, origins=origins, rejections=rejections, ignored=ignored)
