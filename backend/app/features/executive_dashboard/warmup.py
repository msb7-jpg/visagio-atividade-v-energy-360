"""Pré-cálculo do Painel na subida da API, para o diretor abrir a tela sem esperar as consultas pesadas."""

import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.features.executive_dashboard.dependencies import (
    get_base_window,
    get_current_window,
    get_executive_dashboard_service,
)
from app.shared.exceptions import DomainException

logger = logging.getLogger(__name__)


async def warm_up_dashboard(session_factory: async_sessionmaker[AsyncSession], settings: Settings) -> None:
    """Calcula os indicadores dos períodos padrão e o retrato de perdas e deixa os dois no cache.

    Falhas não derrubam a API: sem as tabelas Gold, o Painel responde o erro normal quando for aberto.

    Args:
        session_factory: Fábrica de sessões assíncronas do banco.
        settings: Configuração da aplicação (competência de referência da Fila de Perdas).
    """
    started = time.monotonic()
    async with session_factory() as session:
        service = get_executive_dashboard_service(session, settings)
        try:
            await service.get_indicators(get_base_window(), get_current_window())
            await service.get_losses_snapshot()
        except DomainException as e:
            logger.warning("Painel do Diretor sem pré-cálculo: %s", e.message)
            return
    logger.info("Painel do Diretor pré-calculado em %.1f s.", time.monotonic() - started)
