"""Pré-cálculo do backtest na subida da API, para a tela Efetividade abrir sem esperar os cortes."""

import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.features.loss_management.dependencies import build_backtest_series_service
from app.features.loss_management.excluded_schemas import ExcludedUnitsFilterDTO
from app.features.loss_management.excluded_service import ExcludedQueueService
from app.features.loss_management.repository_factory import build_loss_repository
from app.features.loss_management.schemas import SuspiciousUnitsFilterDTO
from app.features.loss_management.service import LossService
from app.shared.exceptions import DomainException

logger = logging.getLogger(__name__)


async def warm_up_loss_queue(session_factory: async_sessionmaker[AsyncSession], settings: Settings) -> None:
    """Deixa a Fila de Inspeção e a aba "Fora da fila" calculadas, para a primeira abertura da tela não esperar.

    Cada cálculo varre a carteira inteira (segundos). Falhas não derrubam a API: sem as tabelas Gold, as telas
    respondem o erro normal quando forem abertas.

    Args:
        session_factory: Fábrica de sessões assíncronas do banco.
        settings: Configuração da aplicação (competência fixada da fila).
    """
    started = time.monotonic()
    async with session_factory() as session:
        repository = build_loss_repository(session, settings)
        try:
            await LossService(repository).list_suspicious_units(SuspiciousUnitsFilterDTO())
            await ExcludedQueueService(repository).list_excluded_units(ExcludedUnitsFilterDTO())
        except DomainException as e:
            logger.warning("Fila de Inspeção sem pré-cálculo: %s", e.message)
            return
        except Exception:  # o pré-cálculo é só uma otimização: nunca pode derrubar a API
            logger.exception("Fila de Inspeção sem pré-cálculo por um erro inesperado.")
            return
    logger.info("Fila de Inspeção e Fora da fila prontas em %.1f s.", time.monotonic() - started)


async def warm_up_loss_screens(session_factory: async_sessionmaker[AsyncSession], settings: Settings) -> None:
    """Aquece o backtest e, depois, a fila e o Fora da fila, nessa ordem.

    Se o backtest precisar calcular os cortes, ele passa pelos mesmos caches da fila (uma entrada por banco) e a
    expulsa. Por isso a fila de hoje é a última a entrar: o que fica pronto é o que a tela da Fila vai pedir.

    Args:
        session_factory: Fábrica de sessões assíncronas do banco.
        settings: Configuração da aplicação (competência fixada e arquivo do backtest guardado).
    """
    await warm_up_backtest_series(session_factory, settings)
    await warm_up_loss_queue(session_factory, settings)


async def warm_up_backtest_series(session_factory: async_sessionmaker[AsyncSession], settings: Settings) -> None:
    """Deixa o backtest de todos os cortes pronto na memória, lendo o disco ou calculando se for preciso.

    Falhas não derrubam a API: sem as tabelas Gold, a tela Efetividade responde o erro normal quando for aberta.

    Args:
        session_factory: Fábrica de sessões assíncronas do banco.
        settings: Configuração da aplicação (competência fixada e arquivo do resultado guardado).
    """
    started = time.monotonic()
    async with session_factory() as session:
        try:
            await build_backtest_series_service(session, settings).run()
        except DomainException as e:
            logger.warning("Backtest sem pré-cálculo: %s", e.message)
            return
        except Exception:  # o pré-cálculo é só uma otimização: nunca pode derrubar a API
            logger.exception("Backtest sem pré-cálculo por um erro inesperado.")
            return
    logger.info("Backtest da Efetividade pronto em %.1f s.", time.monotonic() - started)
