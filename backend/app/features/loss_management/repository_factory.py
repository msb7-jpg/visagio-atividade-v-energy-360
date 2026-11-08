"""Fábrica do repositório de perdas: aplica a configuração da aplicação em um só lugar."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.features.loss_management.repository import LossRepository


def build_loss_repository(db: AsyncSession, settings: Settings) -> LossRepository:
    """Cria o repositório de perdas com a competência fixada e o modelo de pares da configuração.

    Args:
        db: Sessão assíncrona do banco.
        settings: Configuração da aplicação; `loss_reference_competencia` fixa a competência da fila e
            `loss_use_peers` liga a comparação com os pares da classe (D16).

    Returns:
        O repositório pronto para as rotas e para o pré-cálculo da subida da API.
    """
    return LossRepository(
        db, reference_competencia=settings.loss_reference_competencia, use_peers=settings.loss_use_peers
    )
