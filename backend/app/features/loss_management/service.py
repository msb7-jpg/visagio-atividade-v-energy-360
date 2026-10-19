"""Regras de negócio da fila de suspeitas e do ciclo de vida das ordens de inspeção."""

from app.features.loss_management.exceptions import InspectionConflictError
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspiciousUnitDTO,
)
from app.features.loss_management.scoring import rank_suspicious_units
from app.shared.exceptions import BadRequestException, NotFoundException

ALLOWED_TRANSITIONS: dict[InspectionStatus, frozenset[InspectionStatus]] = {
    InspectionStatus.GERADA: frozenset({InspectionStatus.PENDENTE, InspectionStatus.CANCELADA}),
    InspectionStatus.PENDENTE: frozenset({InspectionStatus.CONCLUIDA, InspectionStatus.CANCELADA}),
    InspectionStatus.CONCLUIDA: frozenset(),
    InspectionStatus.CANCELADA: frozenset(),
}


def validate_transition(current_status: InspectionStatus, payload: InspectionOrderUpdateDTO) -> None:
    """Garante que a mudança de status é permitida e traz os dados obrigatórios."""
    if payload.status not in ALLOWED_TRANSITIONS[current_status]:
        raise InspectionConflictError(
            f"Transição de status inválida: '{current_status}' -> '{payload.status}'."
        )
    if payload.status == InspectionStatus.CONCLUIDA and payload.irregularidade_constatada is None:
        raise BadRequestException("Informe se houve irregularidade constatada para concluir a ordem.")
    has_justification = bool(payload.justificativa_cancelamento and payload.justificativa_cancelamento.strip())
    if payload.status == InspectionStatus.CANCELADA and not has_justification:
        raise BadRequestException("Justificativa é obrigatória para cancelar a ordem.")


class LossService:
    """Orquestra a priorização de suspeitas e a gestão das ordens de inspeção."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def list_suspicious_units(
        self, municipio: str | None, classe: str | None, limit: int
    ) -> list[SuspiciousUnitDTO]:
        profiles = await self.repository.fetch_consumption_profiles(municipio, classe)
        return rank_suspicious_units(profiles, limit)

    async def list_inspections(self, status: InspectionStatus | None) -> list[InspectionOrderDTO]:
        orders = await self.repository.list_orders(status)
        return [InspectionOrderDTO.model_validate(order) for order in orders]

    async def create_inspection(self, payload: InspectionOrderCreateDTO, criado_por: str) -> InspectionOrderDTO:
        if await self.repository.has_active_order(payload.id_uc):
            raise InspectionConflictError(f"A UC {payload.id_uc} já possui ordem de inspeção ativa.")
        order = await self.repository.create_order(payload, criado_por)
        return InspectionOrderDTO.model_validate(order)

    async def update_inspection(self, id_inspecao: int, payload: InspectionOrderUpdateDTO) -> InspectionOrderDTO:
        order = await self.repository.get_order(id_inspecao)
        if order is None:
            raise NotFoundException(f"Ordem de inspeção {id_inspecao} não encontrada.")
        validate_transition(InspectionStatus(order.status), payload)
        changes = payload.model_dump(exclude_none=True)
        updated_order = await self.repository.apply_changes(order, changes)
        return InspectionOrderDTO.model_validate(updated_order)
