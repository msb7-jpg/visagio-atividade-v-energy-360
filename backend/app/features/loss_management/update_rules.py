"""Regras de consistência dos dados de uma atualização de ordem de inspeção (Pure Python)."""

from app.features.loss_management.schemas import InspectionOrderUpdateDTO, InspectionStatus
from app.shared.exceptions import BadRequestException

IRREGULARITY_DETAIL_FIELDS = frozenset({"tipo_irregularidade", "kwh_recuperado", "numero_toi"})

FIELDS_BY_TARGET_STATUS: dict[InspectionStatus, frozenset[str]] = {
    InspectionStatus.PENDENTE: frozenset({"fiscal_responsavel", "inspetor"}),
    InspectionStatus.CONCLUIDA: frozenset(
        {"fiscal_responsavel", "inspetor", "data_inspecao", "irregularidade_constatada"}
    )
    | IRREGULARITY_DETAIL_FIELDS,
    InspectionStatus.CANCELADA: frozenset({"motivo_cancelamento", "justificativa_cancelamento"}),
}


def ensure_required_fields(payload: InspectionOrderUpdateDTO) -> None:
    """Exige o resultado de campo na conclusão.

    O motivo do cancelamento é exigido pelo próprio `InspectionOrderUpdateDTO` (422), não aqui.

    Args:
        payload: Alteração solicitada.

    Raises:
        BadRequestException: Se faltar o resultado de campo.
    """
    if payload.status == InspectionStatus.CONCLUIDA and payload.irregularidade_constatada is None:
        raise BadRequestException("Informe se houve irregularidade constatada para concluir a ordem.")


def ensure_fields_match_status(payload: InspectionOrderUpdateDTO) -> None:
    """Rejeita campos que não pertencem ao status de destino.

    Detalhes da irregularidade (tipo, kWh recuperado, TOI) só valem quando ela foi constatada.

    Args:
        payload: Alteração solicitada.

    Raises:
        BadRequestException: Se vierem campos incompatíveis com o status ou com o resultado de campo.
    """
    informed_fields = payload.model_dump(exclude_none=True, exclude={"status"}).keys()
    allowed_fields = FIELDS_BY_TARGET_STATUS.get(payload.status, frozenset())
    unexpected_fields = sorted(informed_fields - allowed_fields)
    if unexpected_fields:
        raise BadRequestException(
            f"Campos não aceitos para o status '{payload.status}': {', '.join(unexpected_fields)}."
        )
    misplaced_details = sorted(informed_fields & IRREGULARITY_DETAIL_FIELDS)
    if payload.irregularidade_constatada is False and misplaced_details:
        raise BadRequestException(
            f"Sem irregularidade constatada, não informe: {', '.join(misplaced_details)}."
        )
