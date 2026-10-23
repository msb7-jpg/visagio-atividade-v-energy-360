"""Regras de consistência dos dados de uma atualização de ordem de inspeção (Pure Python)."""

from app.features.loss_management.schemas import InspectionOrderUpdateDTO, InspectionStatus
from app.shared.exceptions import BadRequestException

IRREGULARITY_DETAIL_FIELDS = frozenset({"tipo_irregularidade", "kwh_recuperado", "numero_toi"})

FIELDS_BY_TARGET_STATUS: dict[InspectionStatus, frozenset[str]] = {
    InspectionStatus.PENDENTE: frozenset({"fiscal_responsavel"}),
    InspectionStatus.CONCLUIDA: frozenset({"fiscal_responsavel", "irregularidade_constatada"})
    | IRREGULARITY_DETAIL_FIELDS,
    InspectionStatus.CANCELADA: frozenset({"justificativa_cancelamento"}),
}


def ensure_required_fields(payload: InspectionOrderUpdateDTO) -> None:
    """Exige o resultado de campo na conclusão e a justificativa no cancelamento.

    Args:
        payload: Alteração solicitada.

    Raises:
        BadRequestException: Se faltar o resultado de campo ou a justificativa.
    """
    if payload.status == InspectionStatus.CONCLUIDA and payload.irregularidade_constatada is None:
        raise BadRequestException("Informe se houve irregularidade constatada para concluir a ordem.")
    justification_text = (payload.justificativa_cancelamento or "").strip()
    if payload.status == InspectionStatus.CANCELADA and not justification_text:
        raise BadRequestException("Justificativa é obrigatória para cancelar a ordem.")


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
