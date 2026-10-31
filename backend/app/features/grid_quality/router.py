"""Rotas de qualidade da rede: indicadores, ranking e histórico de DEC/FEC por alimentador."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.features.grid_quality.continuity_schemas import AffectedCustomerDTO, ContinuitySnapshotDTO
from app.features.grid_quality.continuity_service import (
    LIMITE_CLIENTES_MAXIMO,
    LIMITE_CLIENTES_MINIMO,
    LIMITE_CLIENTES_PADRAO,
    MESES_CLIENTES_MAXIMO,
    MESES_CLIENTES_MINIMO,
    MESES_CLIENTES_PADRAO,
)
from app.features.grid_quality.dependencies import ContinuitySvc, GridQualitySvc
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
    description="Média do DEC/FEC acumulado no ano entre alimentadores e violações do limite anual.",
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
    description="Alimentadores pelo maior excesso do DEC acumulado no ano sobre o limite anual, com filtro de status.",
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
    description="Últimas competências com DEC/FEC do mês, acumulado no ano e limites anuais; 404 se sem dados.",
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


@router.get(
    "/continuity",
    response_model=ContinuitySnapshotDTO,
    summary="Continuidade: período B (últimos 12 meses) contra A (primeiros 12)",
    description=(
        "KPIs, evento extremo, DEC por município, maiores alimentadores em UC-horas, causas e tipos. "
        "O mês do evento (UC-horas acima de 3x a mediana mensal da rede) sai dos agregados se incluir_evento=false."
    ),
)
async def get_continuity(
    service: ContinuitySvc,
    _user: RequireOperacao,
    municipio: Annotated[str | None, Query(description="Nome do município; vazio traz a rede inteira.")] = None,
    incluir_evento: Annotated[bool, Query(description="Inclui o mês do evento extremo nos agregados.")] = True,
    causa: Annotated[
        str | None,
        Query(description="Causa como no banco ('Sem causa registrada' vale NAO INFORMADA); vazio não filtra."),
    ] = None,
) -> ContinuitySnapshotDTO:
    """Devolve o snapshot de Continuidade do escopo informado.

    Args:
        service: Serviço de Continuidade injetado.
        _user: Usuário autorizado (perfis de operação); só valida o acesso.
        municipio: Município do escopo; sem valor usa a rede inteira.
        incluir_evento: Se falso, remove o mês do evento dos períodos A e B.
        causa: Causa que filtra as ocorrências; o bloco de causas segue mostrando todas.

    Returns:
        KPIs, evento, municípios, alimentadores, causas e tipos.
    """
    return await service.get_snapshot(municipio, incluir_evento, causa)


@router.get(
    "/feeders/{id_alimentador}/customers",
    response_model=list[AffectedCustomerDTO],
    summary="Clientes mais afetados de um alimentador",
    description="UCs do alimentador por horas sem energia nos últimos meses da série; vazia se sem ocorrências.",
)
async def get_affected_customers(
    id_alimentador: str,
    service: ContinuitySvc,
    _user: RequireOperacao,
    meses: Annotated[
        int,
        Query(ge=MESES_CLIENTES_MINIMO, le=MESES_CLIENTES_MAXIMO, description="Janela em meses até a mais recente."),
    ] = MESES_CLIENTES_PADRAO,
    limite: Annotated[
        int, Query(ge=LIMITE_CLIENTES_MINIMO, le=LIMITE_CLIENTES_MAXIMO, description="Quantidade máxima de UCs.")
    ] = LIMITE_CLIENTES_PADRAO,
) -> list[AffectedCustomerDTO]:
    """Devolve as UCs do alimentador com mais horas sem energia na janela.

    Args:
        id_alimentador: Identificador do alimentador.
        service: Serviço de Continuidade injetado.
        _user: Usuário autorizado (perfis de operação); só valida o acesso.
        meses: Janela em meses (1 a 48) até a competência mais recente.
        limite: Quantidade máxima de UCs (1 a 50).

    Returns:
        UCs ordenadas pelas horas sem energia, da maior para a menor.
    """
    return await service.get_affected_customers(id_alimentador, meses, limite)
