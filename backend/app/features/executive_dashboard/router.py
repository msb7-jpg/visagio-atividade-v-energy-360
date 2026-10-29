from fastapi import APIRouter

from app.features.executive_dashboard.dependencies import DashboardBaseWindow, DashboardCurrentWindow, DashboardSvc
from app.features.executive_dashboard.schemas import DashboardIndicatorsDTO, LossesSnapshotDTO
from app.shared.dependencies import RequireDiretoria

router = APIRouter(prefix="/dashboard", tags=["Painel do Diretor"])


@router.get(
    "/indicators",
    response_model=DashboardIndicatorsDTO,
    summary="Indicadores do negócio comparados entre dois períodos",
    description=(
        "Compara a janela base com a janela atual em cinco áreas: comercial, cobrança, rede, atendimento e "
        "medição. Cada indicador traz os dois valores, a variação percentual e se melhorou, piorou ou ficou "
        "estável. Sem parâmetros, compara o primeiro ano da base (2022-07 a 2023-06) com os últimos 12 meses "
        "(2025-07 a 2026-06)."
    ),
    responses={
        400: {"description": "Janelas inválidas ou sobrepostas"},
        404: {"description": "Sem faturamento nas duas janelas"},
        500: {"description": "Tabela Gold ausente ou ilegível"},
    },
)
async def get_indicators(
    _diretoria: RequireDiretoria, base: DashboardBaseWindow, current: DashboardCurrentWindow, service: DashboardSvc
) -> DashboardIndicatorsDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_indicators(base, current)


@router.get(
    "/losses",
    response_model=LossesSnapshotDTO,
    summary="Retrato atual da Fila de Perdas",
    description=(
        "UCs suspeitas na fila, energia e valor recuperáveis e taxa de acerto das inspeções, com o mesmo cálculo "
        "da Fila de Perdas. Não há comparação entre períodos: o histórico de inspeções cobre só ago a dez/2025."
    ),
    responses={500: {"description": "Tabela Gold ausente ou ilegível"}},
)
async def get_losses_snapshot(_diretoria: RequireDiretoria, service: DashboardSvc) -> LossesSnapshotDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_losses_snapshot()
