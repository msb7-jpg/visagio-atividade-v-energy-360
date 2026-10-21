from typing import Annotated
 
from fastapi import Depends, Query
from pydantic import ValidationError
 
from app.features.revenue.repository import RevenueRepository
from app.features.revenue.schemas import COMPETENCIA_PATTERN, PeriodWindow, RevenueFilters
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
 
 
RevenueSvc = Annotated[RevenueService, Depends(get_revenue_service)]
BaseWindow = Annotated[PeriodWindow, Depends(get_base_window)]
CurrentWindow = Annotated[PeriodWindow, Depends(get_current_window)]
Filters = Annotated[RevenueFilters, Depends(get_filters)]