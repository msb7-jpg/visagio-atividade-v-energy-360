"""Rotas de qualidade da rede: indicadores, ranking e histórico de DEC/FEC por alimentador."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.features.grid_quality.dependencies import GridQualitySvc
from app.features.grid_quality.schemas import (
    FeederRankingDTO,
    FeederTimeSeriesDTO,
    QualityIndicatorsDTO,
    QualityStatus,
)
from app.features.grid_quality.service import (
    MESES_HISTORICO_MAXIMO,
    MESES_HISTORICO_MINIMO,
    MESES_HISTORICO_PADRAO,
)
from app.shared.dependencies import RequireOperacao

COMPETENCIA_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"

CompetenciaQuery = Annotated[
    str | None,
    Query(pattern=COMPETENCIA_PATTERN, description="Competência 'YYYY-MM'; padrão: a mais recente."),
]

router = APIRouter(prefix="/quality", tags=["Qualidade da Rede"])


@router.get(
    "/indicators",
    response_model=QualityIndicatorsDTO,
    summary="Indicadores consolidados de DEC/FEC",
    description="Média de DEC/FEC entre alimentadores e contagem de violações em uma competência.",
)
async def get_indicators(
    service: GridQualitySvc, _user: RequireOperacao, competencia: CompetenciaQuery = None
) -> QualityIndicatorsDTO:
    """Devolve os indicadores consolidados da competência informada ou da mais recente.

    Args:
        service: Serviço de qualidade da rede injetado.
        _user: Usuário autorizado (perfis de operação); só valida o acesso.
        competencia: Competência 'YYYY-MM'; sem valor usa a mais recente.

    Returns:
        Indicadores consolidados da competência.
    """
    return await service.get_indicators(competencia)


@router.get(
    "/feeders",
    response_model=list[FeederRankingDTO],
    summary="Ranking de alimentadores por excesso de DEC",
    description="Alimentadores ordenados pelo maior excesso de DEC sobre o limite, com filtro de status.",
)
async def list_feeders(
    service: GridQualitySvc,
    _user: RequireOperacao,
    competencia: CompetenciaQuery = None,
    status: Annotated[QualityStatus | None, Query(description="Filtra pelo status regulatório.")] = None,
) -> list[FeederRankingDTO]:
    """Devolve o ranking de alimentadores da competência, com filtro opcional por status.

    Args:
        service: Serviço de qualidade da rede injetado.
        _user: Usuário autorizado (perfis de operação); só valida o acesso.
        competencia: Competência 'YYYY-MM'; sem valor usa a mais recente.
        status: Filtra pelo status regulatório; sem valor devolve todos.

    Returns:
        Alimentadores por maior excesso de DEC.
    """
    return await service.list_feeders(competencia, status)


@router.get(
    "/feeders/{id_alimentador}/history",
    response_model=FeederTimeSeriesDTO,
    summary="Série histórica de DEC/FEC de um alimentador",
    description="Últimas competências de DEC/FEC apurados e seus limites; 404 se o alimentador não tem dados.",
)
async def get_feeder_history(
    id_alimentador: str,
    service: GridQualitySvc,
    _user: RequireOperacao,
    meses: Annotated[
        int, Query(ge=MESES_HISTORICO_MINIMO, le=MESES_HISTORICO_MAXIMO, description="Competências a devolver.")
    ] = MESES_HISTORICO_PADRAO,
) -> FeederTimeSeriesDTO:
    """Devolve a série histórica mensal do alimentador, da competência mais antiga à mais recente.

    Args:
        id_alimentador: Identificador do alimentador.
        service: Serviço de qualidade da rede injetado.
        _user: Usuário autorizado (perfis de operação); só valida o acesso.
        meses: Quantidade máxima de competências (1 a 48).

    Returns:
        Série histórica do alimentador.
    """
    return await service.get_feeder_history(id_alimentador, meses)
