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
    SuspiciousUnitDTO,
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
    response_model=list[SuspiciousUnitDTO],
    **list_suspicious_units_doc.to_dict(),
)
async def list_suspicious_units(
    service: LossSvc,
    municipio: str | None = None,
    classe: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[SuspiciousUnitDTO]:
    return await service.list_suspicious_units(municipio, classe, limit)


@router.get(
    "/inspections",
    response_model=list[InspectionOrderDTO],
    **list_inspections_doc.to_dict(),
)
async def list_inspections(
    service: LossSvc,
    status_filter: Annotated[InspectionStatus | None, Query(alias="status")] = None,
) -> list[InspectionOrderDTO]:
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
    return await service.create_inspection(payload, criado_por=user.email)


@router.patch(
    "/inspections/{id_inspecao}",
    response_model=InspectionOrderDTO,
    **update_inspection_doc.to_dict(),
)
async def update_inspection(
    id_inspecao: int, payload: InspectionOrderUpdateDTO, service: LossSvc
) -> InspectionOrderDTO:
    return await service.update_inspection(id_inspecao, payload)
