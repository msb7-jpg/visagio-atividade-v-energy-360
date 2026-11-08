"""Rotas de gestão de perdas: fila de suspeitas e ordens de inspeção em campo."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Path, Query, Response, UploadFile, status
from pydantic import StringConstraints

from app.features.loss_management.backtest_schemas import BacktestDTO, BacktestFilterDTO, BacktestSeriesDTO
from app.features.loss_management.dependencies import (
    BacktestSeriesSvc,
    BacktestSvc,
    ExcludedSvc,
    LossSvc,
    OrderEventSvc,
    QueueCurveSvc,
    UnitDetailSvc,
)
from app.features.loss_management.detail_schemas import UnitDetailDTO
from app.features.loss_management.exceptions import UploadTooLargeError
from app.features.loss_management.excluded_schemas import ExcludedQueueDTO, ExcludedUnitsFilterDTO
from app.features.loss_management.order_events import OrderEventDTO
from app.features.loss_management.queue_curve import ReturnCurveDTO
from app.features.loss_management.router_metadata import (
    backtest_doc,
    backtest_series_doc,
    create_inspection_doc,
    excluded_units_doc,
    export_inspections_doc,
    list_inspections_doc,
    list_inspectors_doc,
    list_suspicious_units_doc,
    order_events_doc,
    queue_curve_doc,
    queue_filters_doc,
    queue_summary_doc,
    unit_detail_doc,
    update_inspection_doc,
    upload_inspections_doc,
)
from app.features.loss_management.schemas import (
    FILA_CAPACIDADE_MENSAL,
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    InspectorDTO,
    QueueFiltersDTO,
    QueueSummaryDTO,
    SuspiciousQueueDTO,
    SuspiciousUnitsFilterDTO,
    UploadResultDTO,
)
from app.shared.dependencies import CurrentUser, require_role
from app.shared.role_groups import PERDAS_ACCESS, PERDAS_WRITE

EXPORT_FILENAME = "ordens_inspecao_campo.csv"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_SELECTED_UNITS = FILA_CAPACIDADE_MENSAL * 2
MAX_INSPECTION_COST_RS = 1_000_000
DEFAULT_CURVE_POINTS = 200
MAX_CURVE_POINTS = 500
UnitId = Annotated[str, StringConstraints(min_length=1, max_length=20)]
# Escrita só para o gerente de perdas; o diretor lê (o router já exige PERDAS_ACCESS).
WRITE_ONLY = [Depends(require_role(PERDAS_WRITE))]

router = APIRouter(
    prefix="/losses",
    tags=["Gestão de Perdas"],
    dependencies=[Depends(require_role(PERDAS_ACCESS))],
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


@router.get("/inspections/{id_inspecao}/events", response_model=list[OrderEventDTO], **order_events_doc.to_dict())
async def list_order_events(id_inspecao: int, service: OrderEventSvc) -> list[OrderEventDTO]:
    """Devolve a trilha de auditoria da ordem: quem mudou o quê e quando."""
    return await service.list_events(id_inspecao)


@router.get("/backtest", response_model=BacktestDTO, **backtest_doc.to_dict())
async def run_backtest(service: BacktestSvc, backtest_filter: Annotated[BacktestFilterDTO, Query()]) -> BacktestDTO:
    """Mede o acerto da seleção top N da fila numa data de corte passada, com as inspeções dos meses seguintes."""
    return await service.run(backtest_filter)


@router.get("/backtest/series", response_model=BacktestSeriesDTO, **backtest_series_doc.to_dict())
async def run_backtest_series(service: BacktestSeriesSvc) -> BacktestSeriesDTO:
    """Mede o acerto da seleção da fila em todos os cortes disponíveis, com o resultado guardado entre as chamadas."""
    return await service.run()


@router.get("/excluded-units", response_model=ExcludedQueueDTO, **excluded_units_doc.to_dict())
async def list_excluded_units(
    service: ExcludedSvc, excluded_filter: Annotated[ExcludedUnitsFilterDTO, Query()]
) -> ExcludedQueueDTO:
    """Devolve as UCs com queda de consumo que ficaram fora da fila, com o motivo e a data de reavaliação."""
    return await service.list_excluded_units(excluded_filter)


@router.get("/suspicious-units/{id_uc}", response_model=UnitDetailDTO, **unit_detail_doc.to_dict())
async def get_suspicious_unit_detail(
    id_uc: Annotated[UnitId, Path()],
    service: UnitDetailSvc,
    full_history: Annotated[
        bool,
        Query(alias="historico_completo", description="Série de consumo desde a primeira leitura, em vez de 12 meses."),
    ] = False,
) -> UnitDetailDTO:
    """Devolve o detalhe de uma UC da fila: motivo, conta do score, série de consumo e inspeções anteriores."""
    return await service.get_unit_detail(id_uc, full_history)


@router.get("/queue-summary", response_model=QueueSummaryDTO, **queue_summary_doc.to_dict())
async def queue_summary(
    service: LossSvc,
    selected_units: Annotated[list[UnitId], Query(alias="ucs", default_factory=list, max_length=MAX_SELECTED_UNITS)],
) -> QueueSummaryDTO:
    """Devolve os cartões do topo da Fila de Inspeção para as UCs selecionadas."""
    return await service.summarize_queue(selected_units)


@router.get("/queue-curve", response_model=ReturnCurveDTO, **queue_curve_doc.to_dict())
async def queue_curve(
    service: QueueCurveSvc,
    inspection_cost: Annotated[
        float | None, Query(alias="custo", ge=0, le=MAX_INSPECTION_COST_RS, description="Custo de uma inspeção, em R$.")
    ] = None,
    max_points: Annotated[
        int, Query(alias="pontos", ge=2, le=MAX_CURVE_POINTS, description="Máximo de pontos da curva.")
    ] = DEFAULT_CURVE_POINTS,
) -> ReturnCurveDTO:
    """Devolve o retorno esperado acumulado por número de inspeções e o corte sugerido pelo custo."""
    return await service.build_curve(inspection_cost, max_points)


@router.get("/queue-filters", response_model=QueueFiltersDTO, **queue_filters_doc.to_dict())
async def queue_filters(service: LossSvc) -> QueueFiltersDTO:
    """Devolve as opções dos filtros de município e classe."""
    return await service.list_queue_filters()


@router.get("/inspectors", response_model=list[InspectorDTO], **list_inspectors_doc.to_dict())
async def list_inspectors(service: LossSvc) -> list[InspectorDTO]:
    """Devolve os inspetores de campo (INSP-001 a INSP-040)."""
    return await service.list_inspectors()


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
    dependencies=WRITE_ONLY,
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
    dependencies=WRITE_ONLY,
    **update_inspection_doc.to_dict(),
)
async def update_inspection(
    id_inspecao: int, payload: InspectionOrderUpdateDTO, service: LossSvc, user: CurrentUser
) -> InspectionOrderDTO:
    """Atualiza status, resultado de campo ou cancelamento de uma ordem."""
    return await service.update_inspection(id_inspecao, payload, autor=user.email)


@router.post(
    "/inspections/upload",
    response_model=UploadResultDTO,
    dependencies=WRITE_ONLY,
    **upload_inspections_doc.to_dict(),
)
async def upload_inspections(
    service: LossSvc,
    user: CurrentUser,
    file: Annotated[UploadFile, File(description="Planilha .csv/.xlsx")],
    dry_run: Annotated[bool, Query(description="Só valida e resume, sem gravar")] = False,
) -> UploadResultDTO:
    """Registra os resultados de campo a partir da planilha preenchida pela equipe."""
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise UploadTooLargeError(MAX_UPLOAD_BYTES)
    return await service.upload_field_results(content, file.filename or "", dry_run=dry_run, autor=user.email)
