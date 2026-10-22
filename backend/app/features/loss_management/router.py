"""Rotas de gestão de perdas: fila de suspeitas e ordens de inspeção em campo."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.constants import UserRole
from app.features.loss_management.dependencies import LossSvc
from app.features.loss_management.router_metadata import (
    create_inspection_doc,
    list_inspections_doc,
    list_suspicious_units_doc,
    update_inspection_doc,
)
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspiciousQueueDTO,
    SuspiciousUnitsFilterDTO,
)
from app.shared.dependencies import CurrentUser, require_role

LOSS_ROLES = [UserRole.DIRETOR.value, UserRole.GERENTE_PERDAS.value]

router = APIRouter(
    prefix="/losses",
    tags=["Gestão de Perdas"],
    dependencies=[Depends(require_role(LOSS_ROLES))],
)


@router.get(
    "/suspicious-units",
    response_model=SuspiciousQueueDTO,
    **list_suspicious_units_doc.to_dict(),
)
async def list_suspicious_units(
    service: LossSvc, queue_filter: Annotated[SuspiciousUnitsFilterDTO, Query()]
) -> SuspiciousQueueDTO:
    """Devolve a fila de UCs suspeitas priorizada."""
    return await service.list_suspicious_units(queue_filter)


@router.get(
    "/inspections",
    response_model=list[InspectionOrderDTO],
    **list_inspections_doc.to_dict(),
)
async def list_inspections(
    service: LossSvc,
    status_filter: Annotated[InspectionStatus | None, Query(alias="status")] = None,
) -> list[InspectionOrderDTO]:
    """Lista as ordens de inspeção, com filtro opcional por status."""
    return await service.list_inspections(status_filter)


@router.post(
    "/inspections",
    response_model=InspectionOrderDTO,
    status_code=status.HTTP_201_CREATED,
    **create_inspection_doc.to_dict(),
)
async def create_inspection(
    payload: InspectionOrderCreateDTO, service: LossSvc, user: CurrentUser
) -> InspectionOrderDTO:
    """Gera uma ordem de inspeção registrando o usuário autenticado como autor."""
    return await service.create_inspection(payload, criado_por=user.email)


@router.patch(
    "/inspections/{id_inspecao}",
    response_model=InspectionOrderDTO,
    **update_inspection_doc.to_dict(),
)
async def update_inspection(
    id_inspecao: int, payload: InspectionOrderUpdateDTO, service: LossSvc
) -> InspectionOrderDTO:
    """Atualiza status, resultado de campo ou cancelamento de uma ordem."""
    return await service.update_inspection(id_inspecao, payload)
