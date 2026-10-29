"""Injeção do serviço do Painel do Diretor e das janelas comparadas."""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.features.executive_dashboard.cache import dashboard_cache
from app.features.executive_dashboard.repository import ExecutiveDashboardRepository
from app.features.executive_dashboard.service import ExecutiveDashboardService
from app.features.loss_management.repository import LossRepository
from app.features.revenue.dependencies import CompetenciaQuery, build_window
from app.features.revenue.repository import RevenueRepository
from app.features.revenue.schemas import PeriodWindow
from app.shared.dependencies import DbSession

BASE_INICIO_PADRAO = "2022-07"
BASE_FIM_PADRAO = "2023-06"
ATUAL_INICIO_PADRAO = "2025-07"
ATUAL_FIM_PADRAO = "2026-06"


def get_executive_dashboard_service(
    db: DbSession, settings: Annotated[Settings, Depends(get_settings)]
) -> ExecutiveDashboardService:
    """Monta o serviço com os repositórios do Painel, da Receita (Fatia 04) e da Fila de Perdas (Fatia 05).

    Args:
        db: Sessão assíncrona do banco injetada por requisição.
        settings: Configuração da aplicação; fornece a competência de referência da fila, se fixada.

    Returns:
        Serviço pronto para uso pelas rotas.
    """
    return ExecutiveDashboardService(
        repository=ExecutiveDashboardRepository(db),
        revenue_repository=RevenueRepository(db),
        loss_repository=LossRepository(db, reference_competencia=settings.loss_reference_competencia),
        cache=dashboard_cache,
    )


def get_base_window(
    base_inicio: CompetenciaQuery = BASE_INICIO_PADRAO, base_fim: CompetenciaQuery = BASE_FIM_PADRAO
) -> PeriodWindow:
    """Janela base; sem parâmetros, o primeiro ano da base de dados (pergunta do diretor no case)."""
    return build_window(base_inicio, base_fim)


def get_current_window(
    atual_inicio: CompetenciaQuery = ATUAL_INICIO_PADRAO, atual_fim: CompetenciaQuery = ATUAL_FIM_PADRAO
) -> PeriodWindow:
    """Janela atual; sem parâmetros, os últimos 12 meses da base de dados."""
    return build_window(atual_inicio, atual_fim)


DashboardSvc = Annotated[ExecutiveDashboardService, Depends(get_executive_dashboard_service)]
DashboardBaseWindow = Annotated[PeriodWindow, Depends(get_base_window)]
DashboardCurrentWindow = Annotated[PeriodWindow, Depends(get_current_window)]
