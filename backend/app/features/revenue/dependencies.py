from typing import Annotated

from fastapi import Depends, Query
from pydantic import ValidationError

from app.features.revenue.repository import RevenueRepository
from app.features.revenue.schemas import (
    COMPETENCIA_PATTERN,
    BreakdownLevel,
    BreakdownQuery,
    BreakdownSortField,
    NeighborhoodHistoryRequest,
    PeriodWindow,
    RevenueFilters,
    SortOrder,
)
from app.features.revenue.service import RevenueService
from app.shared.dependencies import DbSession
from app.shared.exceptions import BadRequestException

CompetenciaQuery = Annotated[str, Query(pattern=COMPETENCIA_PATTERN, examples=["2026-06"])]


def get_revenue_service(db: DbSession) -> RevenueService:
    return RevenueService(repository=RevenueRepository(db))


def build_window(inicio: str, fim: str) -> PeriodWindow:
    """Monta a janela ou responde 400 quando a competência inicial é posterior à final."""
    try:
        return PeriodWindow(competencia_inicio=inicio, competencia_fim=fim)
    except ValidationError as error:
        raise BadRequestException(f"Janela inválida: {inicio} a {fim}. O início deve ser anterior ao fim.") from error


def get_base_window(base_inicio: CompetenciaQuery, base_fim: CompetenciaQuery) -> PeriodWindow:
    return build_window(base_inicio, base_fim)


def get_current_window(atual_inicio: CompetenciaQuery, atual_fim: CompetenciaQuery) -> PeriodWindow:
    return build_window(atual_inicio, atual_fim)


def get_filters(
    municipio: Annotated[str | None, Query(description="Filtra por município")] = None,
    bairro: Annotated[str | None, Query(description="Filtra por bairro")] = None,
    classe_consumo: Annotated[str | None, Query(description="Filtra por classe de consumo")] = None,
) -> RevenueFilters:
    return RevenueFilters(municipio=municipio, bairro=bairro, classe_consumo=classe_consumo)


def get_breakdown_query(
    nivel: Annotated[BreakdownLevel, Query(description="Nível do detalhamento")] = BreakdownLevel.BAIRRO,
    ordenar_por: Annotated[BreakdownSortField, Query(description="Coluna usada na ordenação")] = (
        BreakdownSortField.EFEITO_VOLUME
    ),
    ordem: Annotated[SortOrder, Query(description="asc coloca a maior perda de receita primeiro")] = SortOrder.ASC,
    page: Annotated[int, Query(ge=1, description="Número da página (iniciando em 1)")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Itens por página")] = 20,
) -> BreakdownQuery:
    return BreakdownQuery(nivel=nivel, ordenar_por=ordenar_por, ordem=ordem, page=page, page_size=page_size)


def get_history_request(
    municipio: Annotated[str, Query(description="Município do bairro")],
    bairro: Annotated[str, Query(description="Bairro")],
    competencia_fim: CompetenciaQuery,
    classe_consumo: Annotated[str | None, Query(description="Filtra por classe de consumo")] = None,
    meses: Annotated[int, Query(ge=1, le=60, description="Quantidade de competências até competencia_fim")] = 24,
) -> NeighborhoodHistoryRequest:
    return NeighborhoodHistoryRequest(
        municipio=municipio, bairro=bairro, competencia_fim=competencia_fim, classe_consumo=classe_consumo, meses=meses
    )


RevenueSvc = Annotated[RevenueService, Depends(get_revenue_service)]
BaseWindow = Annotated[PeriodWindow, Depends(get_base_window)]
CurrentWindow = Annotated[PeriodWindow, Depends(get_current_window)]
Filters = Annotated[RevenueFilters, Depends(get_filters)]
BreakdownParams = Annotated[BreakdownQuery, Depends(get_breakdown_query)]
HistoryRequest = Annotated[NeighborhoodHistoryRequest, Depends(get_history_request)]