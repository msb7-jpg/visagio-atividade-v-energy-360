from fastapi import APIRouter
 
from app.features.revenue.dependencies import BaseWindow, CurrentWindow, Filters, RevenueSvc
from app.features.revenue.schemas import PriceVolumeDecompositionDTO
from app.shared.dependencies import RequireDiretoria
 
router = APIRouter(prefix="/revenue", tags=["Inteligência Comercial"])
 
 
@router.get(
    "/decomposition",
    response_model=PriceVolumeDecompositionDTO,
    summary="Decomposição Preço-Volume-Mix da variação de receita",
    description=(
        "Compara a janela base com a janela atual e separa a variação de receita em efeito-preço, "
        "efeito-volume, mix e efeito cruzado, com o detalhe por classe, município e bairro. "
        "A soma dos efeitos é igual à variação total de receita."
    ),
    responses={
        400: {"description": "Janelas inválidas ou sobrepostas"},
        404: {"description": "Sem faturamento para as janelas e filtros pedidos"},
    },
)
async def get_decomposition(
    _diretoria: RequireDiretoria, base: BaseWindow, current: CurrentWindow, filters: Filters, service: RevenueSvc
) -> PriceVolumeDecompositionDTO:
    """Acesso restrito ao perfil diretor (`RequireDiretoria`)."""
    return await service.get_decomposition(base, current, filters)