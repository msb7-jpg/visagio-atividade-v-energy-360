"""Rotas da Visão 360 da Unidade Consumidora para a tela única de atendimento."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.features.customer360.dependencies import Customer360Svc
from app.features.customer360.router_metadata import (
    customer_events_doc,
    customer_history_doc,
    customer_summary_doc,
    search_customers_doc,
)
from app.features.customer360.schemas import (
    CustomerEventTimelineDTO,
    CustomerHistoryDTO,
    CustomerSearchResultDTO,
    CustomerSummaryDTO,
)
from app.shared.dependencies import require_role
from app.shared.role_groups import CUSTOMER360_ACCESS

router = APIRouter(
    prefix="/customers",
    tags=["Visão 360 da UC"],
    dependencies=[Depends(require_role(CUSTOMER360_ACCESS))],
)


@router.get("/search", response_model=list[CustomerSearchResultDTO], **search_customers_doc.to_dict())
async def search_customers(
    service: Customer360Svc,
    termo: Annotated[str, Query(alias="q", min_length=1, max_length=80)],
    limite: Annotated[int, Query(ge=1, le=20)] = 8,
) -> list[CustomerSearchResultDTO]:
    return await service.search(termo, limite)


@router.get("/{id_uc}/summary", response_model=CustomerSummaryDTO, **customer_summary_doc.to_dict())
async def get_customer_summary(id_uc: str, service: Customer360Svc) -> CustomerSummaryDTO:
    return await service.get_summary(id_uc)


@router.get("/{id_uc}/history", response_model=CustomerHistoryDTO, **customer_history_doc.to_dict())
async def get_customer_history(id_uc: str, service: Customer360Svc) -> CustomerHistoryDTO:
    return await service.get_history(id_uc)


@router.get("/{id_uc}/events", response_model=CustomerEventTimelineDTO, **customer_events_doc.to_dict())
async def get_customer_events(id_uc: str, service: Customer360Svc) -> CustomerEventTimelineDTO:
    return await service.get_events(id_uc)
