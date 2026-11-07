"""Fábrica de injeção do serviço de gestão de perdas."""

from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.features.loss_management.backtest_series import BacktestSeriesService
from app.features.loss_management.backtest_service import BacktestService
from app.features.loss_management.backtest_store import BacktestSeriesStore
from app.features.loss_management.detail_repository import UnitDetailRepository
from app.features.loss_management.excluded_service import ExcludedQueueService
from app.features.loss_management.order_event_service import OrderEventService
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.service import LossService
from app.features.loss_management.unit_detail_service import UnitDetailService
from app.shared.dependencies import DbSession


def get_loss_service(db: DbSession, settings: Annotated[Settings, Depends(get_settings)]) -> LossService:
    """Monta o serviço de gestão de perdas com o repositório da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.
        settings: Configuração da aplicação; fornece a competência de referência da fila, se fixada.

    Returns:
        Serviço pronto para uso pelas rotas.
    """
    repository = LossRepository(db, reference_competencia=settings.loss_reference_competencia)
    return LossService(repository=repository)


LossSvc = Annotated[LossService, Depends(get_loss_service)]


def get_excluded_queue_service(
    db: DbSession, settings: Annotated[Settings, Depends(get_settings)]
) -> ExcludedQueueService:
    """Monta o serviço da aba "Fora da fila" com o repositório da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.
        settings: Configuração da aplicação; fornece a competência de referência da fila, se fixada.

    Returns:
        Serviço pronto para uso pela rota de UCs excluídas.
    """
    return ExcludedQueueService(LossRepository(db, reference_competencia=settings.loss_reference_competencia))


ExcludedSvc = Annotated[ExcludedQueueService, Depends(get_excluded_queue_service)]


def get_backtest_service(db: DbSession, settings: Annotated[Settings, Depends(get_settings)]) -> BacktestService:
    """Monta o serviço do backtest da fila (Efetividade) com o repositório da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.
        settings: Configuração da aplicação; fornece a competência de referência da fila, se fixada.

    Returns:
        Serviço pronto para uso pela rota de backtest.
    """
    return BacktestService(LossRepository(db, reference_competencia=settings.loss_reference_competencia))


BacktestSvc = Annotated[BacktestService, Depends(get_backtest_service)]


def build_backtest_series_service(db: AsyncSession, settings: Settings) -> BacktestSeriesService:
    """Monta o serviço do backtest de todos os cortes, com o resultado guardado em disco (se configurado).

    Args:
        db: Sessão assíncrona do banco.
        settings: Configuração da aplicação; fornece a competência fixada e o arquivo do resultado guardado.

    Returns:
        Serviço pronto para uso pela rota e pelo pré-cálculo da subida da API.
    """
    repository = LossRepository(db, reference_competencia=settings.loss_reference_competencia)
    cache_path = Path(settings.loss_backtest_cache_path) if settings.loss_backtest_cache_path else None
    return BacktestSeriesService(repository, BacktestService(repository), BacktestSeriesStore(cache_path))


def get_backtest_series_service(
    db: DbSession, settings: Annotated[Settings, Depends(get_settings)]
) -> BacktestSeriesService:
    """Injeta o serviço do backtest de todos os cortes na rota da tela Efetividade."""
    return build_backtest_series_service(db, settings)


BacktestSeriesSvc = Annotated[BacktestSeriesService, Depends(get_backtest_series_service)]


def get_order_event_service(db: DbSession) -> OrderEventService:
    """Monta o serviço da trilha de auditoria das ordens com o repositório da sessão atual."""
    return OrderEventService(LossRepository(db))


OrderEventSvc = Annotated[OrderEventService, Depends(get_order_event_service)]


def get_unit_detail_service(db: DbSession, settings: Annotated[Settings, Depends(get_settings)]) -> UnitDetailService:
    """Monta o serviço do detalhe da UC com os repositórios da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.
        settings: Configuração da aplicação; fornece a competência de referência da fila, se fixada.

    Returns:
        Serviço pronto para uso pela rota de detalhe.
    """
    fixed_competencia = settings.loss_reference_competencia
    return UnitDetailService(
        queue_repository=LossRepository(db, reference_competencia=fixed_competencia),
        detail_repository=UnitDetailRepository(db, reference_competencia=fixed_competencia),
    )


UnitDetailSvc = Annotated[UnitDetailService, Depends(get_unit_detail_service)]
