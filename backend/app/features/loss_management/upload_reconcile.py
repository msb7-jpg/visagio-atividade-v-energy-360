"""Conciliação das linhas da planilha de campo com as ordens de inspeção ativas (Pure Python)."""

import re
from collections.abc import Mapping, Sequence
from contextlib import suppress
from dataclasses import dataclass

from pydantic import ValidationError

from app.features.loss_management.schemas import InspectionOrderUpdateDTO, InspectionStatus, RejectedRowDTO
from app.features.loss_management.update_rules import ensure_fields_match_status, ensure_required_fields
from app.features.loss_management.upload_parser import KEY_COLUMN, UNIT_COLUMN, RawRow
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


def integer_from_cell(raw: object) -> object:
    """Converte decimal inteiro do Excel (15.0) e texto inteiro ("15", "15,0") em `int`; outros valores passam."""
    if isinstance(raw, float) and raw.is_integer():
        return int(raw)
    if isinstance(raw, str) and (integer_match := INTEGER_TEXT.fullmatch(raw.strip())):
        return int(integer_match.group(1))
    return raw


def parse_order_id(raw: object) -> int:
    """Lê o `id_inspecao` da célula (texto, inteiro ou decimal inteiro do Excel).

    Raises:
        InvalidValueError: Se não for um inteiro positivo.
    """
    order_id = integer_from_cell(raw)
    if isinstance(order_id, bool) or not isinstance(order_id, int) or order_id <= 0:
        raise InvalidValueError(f"{KEY_COLUMN}: valor '{raw}' inválido.")
    return order_id


def referenced_order_ids(rows: Sequence[RawRow]) -> set[int]:
    """Identificadores de ordem citados na planilha, ignorando as células de id inválidas."""
    order_ids: set[int] = set()
    for row in rows:
        with suppress(InvalidValueError):
            order_ids.add(parse_order_id(row.cells.get(KEY_COLUMN)))
    return order_ids


def fallback_unit_id(row: RawRow) -> str | None:
    """UC da linha quando o `id_inspecao` não é um id do portal (ex.: `IN0000007` na planilha do campo).

    Returns:
        O `id_uc` da linha, ou None se o `id_inspecao` é um id do portal válido ou se a linha não traz UC.
    """
    try:
        parse_order_id(row.cells.get(KEY_COLUMN))
    except InvalidValueError:
        return text_or_none(row.cells.get(UNIT_COLUMN))
    return None


def referenced_unit_ids(rows: Sequence[RawRow]) -> set[str]:
    """UCs cuja ordem ativa precisa ser buscada porque a linha não traz um id de ordem do portal."""
    return {unit_id for row in rows if (unit_id := fallback_unit_id(row)) is not None}


def resolve_order_id(row: RawRow, active_order_by_uc: Mapping[str, int]) -> int:
    """Identifica a ordem da linha: pelo `id_inspecao` do portal ou, na falta dele, pela ordem ativa da UC.

    Raises:
        InvalidValueError: Se o id for inválido e a linha não trouxer UC, ou se a UC não tiver ordem ativa.
    """
    unit_id = fallback_unit_id(row)
    if unit_id is None:
        return parse_order_id(row.cells.get(KEY_COLUMN))
    order_id = active_order_by_uc.get(unit_id)
    if order_id is None:
        raise InvalidValueError(f"UC {unit_id} sem ordem ativa (gerada ou em campo) no portal.")
    return order_id


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
        return f"{first_error['loc'][0]}: {first_error['msg'].removeprefix('Value error, ')}"
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
    inspection_date = parse_field_date(cells.get("data_inspecao"))
    reported_kwh = parse_kwh(cells.get("kwh_recuperado"))
    if irregularity is None:
        raise InvalidValueError("irregularidade_constatada: preencha o resultado da inspeção.")
    has_details = irregularity is True
    update = InspectionOrderUpdateDTO(
        status=InspectionStatus.CONCLUIDA,
        fiscal_responsavel=text_or_none(cells.get("fiscal_responsavel")),
        inspetor=text_or_none(cells.get("inspetor")),
        data_inspecao=inspection_date,
        irregularidade_constatada=irregularity,
        tipo_irregularidade=text_or_none(cells.get("tipo_irregularidade")) if has_details else None,
        kwh_recuperado=reported_kwh if has_details or reported_kwh else None,  # 0 kWh = "nada consta"
        numero_toi=text_or_none(cells.get("numero_toi")) if has_details else None,
    )
    ensure_required_fields(update)
    ensure_fields_match_status(update)
    return update


def reconcile_rows(
    rows: Sequence[RawRow],
    order_statuses: Mapping[int, InspectionStatus],
    active_order_by_uc: Mapping[str, int] | None = None,
) -> ReconciliationPlan:
    """Concilia cada linha com sua ordem sem abortar o lote por uma linha inválida.

    A ordem é a de mesmo `id_inspecao` (planilha exportada pelo portal) ou, quando o id não é do portal,
    a ordem ativa da `id_uc` da linha (planilha do campo).

    Args:
        rows: Linhas lidas da planilha.
        order_statuses: Status atual das ordens citadas na planilha (ausente = ordem inexistente).
        active_order_by_uc: Ordem ativa de cada UC citada em linhas sem id de ordem do portal.

    Returns:
        As atualizações a aplicar (uma por ordem), as recusas com motivo e a contagem de linhas sem resultado.
    """
    updates: dict[int, InspectionOrderUpdateDTO] = {}
    origins: dict[int, RawRow] = {}
    rejections: list[RejectedRowDTO] = []
    for row in rows:
        outcome = reconcile_row(row, active_order_by_uc or {}, order_statuses, updates)
        if outcome.rejection is not None:
            rejections.append(outcome.rejection)
        elif outcome.update is not None and outcome.order_id is not None:
            updates[outcome.order_id] = outcome.update
            origins[outcome.order_id] = row
    ignored = len(rows) - len(updates) - len(rejections)
    return ReconciliationPlan(updates=updates, origins=origins, rejections=rejections, ignored=ignored)


@dataclass(frozen=True)
class RowOutcome:
    """Destino de uma linha: atualização a aplicar, recusa com motivo ou nenhum dos dois (sem resultado)."""

    order_id: int | None
    update: InspectionOrderUpdateDTO | None = None
    rejection: RejectedRowDTO | None = None


def reconcile_row(
    row: RawRow,
    unit_orders: Mapping[str, int],
    order_statuses: Mapping[int, InspectionStatus],
    planned_updates: Mapping[int, InspectionOrderUpdateDTO],
) -> RowOutcome:
    """Concilia uma linha com sua ordem; a recusa volta como resultado, não como exceção.

    Args:
        row: Linha lida da planilha.
        unit_orders: Ordem ativa de cada UC citada em linhas sem id de ordem do portal.
        order_statuses: Status atual das ordens citadas na planilha.
        planned_updates: Atualizações já planejadas para linhas anteriores, para barrar duplicatas.

    Returns:
        A atualização, a recusa com motivo, ou nem uma nem outra se a linha não traz resultado.
    """
    order_id: int | None = None
    try:
        order_id = resolve_order_id(row, unit_orders)
        update = build_update(row)
        if update is not None:
            ensure_order_accepts_result(order_id, order_statuses.get(order_id))
            ensure_not_duplicated(order_id, planned_updates)
        return RowOutcome(order_id=order_id, update=update)
    except REJECTABLE_ERRORS as error:
        rejection = RejectedRowDTO(
            aba=row.sheet, linha=row.line, id_inspecao=order_id, motivo=describe_rejection(error)
        )
        return RowOutcome(order_id=order_id, rejection=rejection)


def ensure_not_duplicated(order_id: int, planned_updates: Mapping[int, InspectionOrderUpdateDTO]) -> None:
    """Garante que a ordem ainda não foi conciliada por uma linha anterior do mesmo arquivo.

    Raises:
        InvalidValueError: Se a ordem já tem atualização planejada.
    """
    if order_id in planned_updates:
        raise InvalidValueError(
            f"Linha duplicada: a ordem {order_id} já foi conciliada neste arquivo; "
            "o valor da primeira ocorrência foi mantido."
        )


def skipped_rejections(plan: ReconciliationPlan, applied_ids: Sequence[int]) -> list[RejectedRowDTO]:
    """Recusas das ordens planejadas que deixaram o fluxo de campo antes da gravação e não foram alteradas."""
    applied_set = set(applied_ids)
    return [
        RejectedRowDTO(
            aba=plan.origins[order_id].sheet,
            linha=plan.origins[order_id].line,
            id_inspecao=order_id,
            motivo=f"Ordem {order_id} deixou o fluxo de campo durante o envio e não foi alterada.",
        )
        for order_id in plan.updates
        if order_id not in applied_set
    ]
