"""Rotas de gestão de perdas: fila de suspeitas e ordens de inspeção em campo."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status

from app.core.constants import UserRole
from app.features.loss_management.dependencies import LossSvc
from app.features.loss_management.exceptions import UploadTooLargeError
from app.features.loss_management.router_metadata import (
    create_inspection_doc,
    export_inspections_doc,
    list_inspections_doc,
    list_suspicious_units_doc,
    update_inspection_doc,
    upload_inspections_doc,
)
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspiciousQueueDTO,
    SuspiciousUnitsFilterDTO,
    UploadResultDTO,
)
from app.shared.dependencies import CurrentUser, require_role

LOSS_ROLES = [UserRole.DIRETOR.value, UserRole.GERENTE_PERDAS.value]
EXPORT_FILENAME = "ordens_inspecao_campo.csv"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

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


@router.get(
    "/inspections/export",
    response_class=Response,
    **export_inspections_doc.to_dict(),
)
async def export_inspections(service: LossSvc) -> Response:
    """Baixa o CSV das ordens ativas para despacho à equipe de campo."""
    csv_content = await service.export_field_orders_csv()
    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{EXPORT_FILENAME}"'},
    )


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


@router.post(
    "/inspections/upload",
    response_model=UploadResultDTO,
    **upload_inspections_doc.to_dict(),
)
async def upload_inspections(
    service: LossSvc, file: Annotated[UploadFile, File(description="Planilha .csv/.xlsx")]
) -> UploadResultDTO:
    """Registra os resultados de campo a partir da planilha preenchida pela equipe."""
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise UploadTooLargeError(MAX_UPLOAD_BYTES)
    return await service.upload_field_results(content, file.filename or "")
