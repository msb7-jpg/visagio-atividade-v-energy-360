from fastapi import APIRouter

from app.features.revenue.dependencies import (
    BaseWindow,
    BreakdownParams,
    CurrentWindow,
    Filters,
    HistoryRequest,
    RevenueSvc,
)
from app.features.revenue.schemas import (
    BreakdownRowDTO,
    NeighborhoodHistoryDTO,
    PriceVolumeDecompositionDTO,
    RevenueKpisDTO,
)
from app.shared.dependencies import RequireDiretoria
from app.shared.pagination import PaginatedResponse

router = APIRouter(prefix="/revenue", tags=["Inteligência Comercial"])


@router.get(
    "/decomposition",
    response_model=PriceVolumeDecompositionDTO,
    summary="Decomposição Preço-Volume-Mix da variação de receita",
    description=(
        "Compara a janela base com a janela atual e separa a variação de receita em efeito-preço, "
        "efeito-volume, mix e efeito cruzado, com o detalhe por classe, município e bairro. "
        "A soma dos efeitos é igual à variação total de receita."
    ),
    responses={
        400: {"description": "Janelas inválidas ou sobrepostas"},
        404: {"description": "Sem faturamento para as janelas e filtros pedidos"},
    },
)
async def get_decomposition(
    _diretoria: RequireDiretoria, base: BaseWindow, current: CurrentWindow, filters: Filters, service: RevenueSvc
) -> PriceVolumeDecompositionDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_decomposition(base, current, filters)


@router.get(
    "/kpis",
    response_model=RevenueKpisDTO,
    summary="Indicadores executivos de receita",
    description=(
        "Compara a janela base com a janela atual em faturamento, volume faturado, tarifa média ponderada, "
        "ticket médio mensal por UC e UCs ativas, cada um com a variação percentual."
    ),
    responses={
        400: {"description": "Janelas inválidas ou sobrepostas"},
        404: {"description": "Sem faturamento para as janelas e filtros pedidos"},
    },
)
async def get_kpis(
    _diretoria: RequireDiretoria, base: BaseWindow, current: CurrentWindow, filters: Filters, service: RevenueSvc
) -> RevenueKpisDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_kpis(base, current, filters)


@router.get(
    "/breakdown",
    response_model=PaginatedResponse[BreakdownRowDTO],
    summary="Ranking da variação de receita por município, bairro ou classe",
    description=(
        "Detalha a variação de receita por município, bairro ou classe de consumo, com efeito-preço, efeito-volume "
        "e efeito cruzado de cada linha. Por padrão, a maior perda por efeito-volume vem primeiro. "
        "A resposta é paginada (`page` e `page_size`)."
    ),
    responses={
        400: {"description": "Janelas inválidas ou sobrepostas"},
        404: {"description": "Sem faturamento para as janelas e filtros pedidos"},
    },
)
async def get_breakdown(
    _diretoria: RequireDiretoria,
    base: BaseWindow,
    current: CurrentWindow,
    filters: Filters,
    service: RevenueSvc,
    query: BreakdownParams,
) -> PaginatedResponse[BreakdownRowDTO]:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_breakdown(base, current, filters, query)


@router.get(
    "/history",
    response_model=NeighborhoodHistoryDTO,
    summary="Histórico mensal de volume, receita e tarifa média de um bairro",
    description=(
        "Série mensal contínua dos últimos `meses` (padrão 24) até `competencia_fim`, para o bairro escolhido no "
        "ranking. Meses sem faturamento aparecem com volume e receita zero e sem tarifa média."
    ),
    responses={404: {"description": "Sem faturamento do bairro na janela pedida"}},
)
async def get_neighborhood_history(
    _diretoria: RequireDiretoria, request: HistoryRequest, service: RevenueSvc
) -> NeighborhoodHistoryDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_neighborhood_history(request)