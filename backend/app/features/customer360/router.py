"""Rotas da Visão 360 da Unidade Consumidora para a tela única de atendimento."""

from fastapi import APIRouter, Depends

from app.core.constants import UserRole
from app.features.customer360.dependencies import Customer360Svc
from app.features.customer360.schemas import CustomerEventTimelineDTO, CustomerHistoryDTO, CustomerSummaryDTO
from app.shared.dependencies import require_role

CUSTOMER360_ROLES = [UserRole.DIRETOR, UserRole.GERENTE_ATENDIMENTO, UserRole.ATENDENTE, UserRole.GERENTE_PERDAS]

router = APIRouter(
    prefix="/customers",
    tags=["Visão 360 da UC"],
    dependencies=[Depends(require_role(CUSTOMER360_ROLES))],
)


@router.get("/{id_uc}/summary", response_model=CustomerSummaryDTO, summary="Cadastro, medidor e geração solar da UC")
async def get_customer_summary(id_uc: str, service: Customer360Svc) -> CustomerSummaryDTO:
    return await service.get_summary(id_uc)


@router.get(
    "/{id_uc}/history",
    response_model=CustomerHistoryDTO,
    summary="Consumo 12 meses vs ano anterior, faturas e diagnóstico de conta alta",
)
async def get_customer_history(id_uc: str, service: Customer360Svc) -> CustomerHistoryDTO:
    return await service.get_history(id_uc)


@router.get(
    "/{id_uc}/events",
    response_model=CustomerEventTimelineDTO,
    summary="DEC/FEC do alimentador da UC e chamados abertos",
)
async def get_customer_events(id_uc: str, service: Customer360Svc) -> CustomerEventTimelineDTO:
    return await service.get_events(id_uc)
