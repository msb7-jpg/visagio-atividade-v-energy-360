"""Fábrica de injeção do serviço de gestão de perdas."""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.service import LossService
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
