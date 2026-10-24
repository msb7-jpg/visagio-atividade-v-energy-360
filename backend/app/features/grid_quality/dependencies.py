"""Fábrica de injeção do serviço de qualidade da rede."""

from typing import Annotated

from fastapi import Depends

from app.features.grid_quality.repository import GridQualityRepository
from app.features.grid_quality.service import GridQualityService
from app.shared.dependencies import DbSession


def get_grid_quality_service(db: DbSession) -> GridQualityService:
    """Monta o serviço de qualidade da rede com o repositório da sessão atual.

    Args:
        db: Sessão assíncrona do banco injetada por requisição.

    Returns:
        Serviço pronto para uso pelas rotas.
    """
    return GridQualityService(repository=GridQualityRepository(db))


GridQualitySvc = Annotated[GridQualityService, Depends(get_grid_quality_service)]
