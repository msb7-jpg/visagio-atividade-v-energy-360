"""Fábrica de injeção do serviço de gestão de perdas."""

from typing import Annotated

from fastapi import Depends

from app.features.loss_management.repository import LossRepository
from app.features.loss_management.service import LossService
from app.shared.dependencies import DbSession


def get_loss_service(db: DbSession) -> LossService:
    """Monta o serviço de gestão de perdas com o repositório da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.

    Returns:
        Serviço pronto para uso pelas rotas.
    """
    return LossService(repository=LossRepository(db))


LossSvc = Annotated[LossService, Depends(get_loss_service)]
