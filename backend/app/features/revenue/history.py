from collections.abc import Sequence
from dataclasses import dataclass

from app.features.revenue.decomposition import CASAS_DECIMAIS
from app.features.revenue.kpis import CASAS_TARIFA, safe_ratio
from app.features.revenue.schemas import MonthlyPointDTO, NeighborhoodHistoryDTO, NeighborhoodHistoryRequest

MESES_POR_ANO = 12


@dataclass(frozen=True, slots=True)
class MonthlyTotals:
    """Volume e receita faturados em uma competência."""

    competencia: str
    volume_kwh: float
    receita_rs: float


def shift_competencia(competencia: str, months: int) -> str:
    """Desloca uma competência 'YYYY-MM' em N meses (negativo volta no tempo)."""
    year_text, month_text = competencia.split("-")
    month_index = int(year_text) * MESES_POR_ANO + int(month_text) - 1 + months
    shifted_year, shifted_month_zero_based = divmod(month_index, MESES_POR_ANO)
    return f"{shifted_year:04d}-{shifted_month_zero_based + 1:02d}"


def competencias_until(last_competencia: str, count: int) -> list[str]:
    """As `count` competências consecutivas que terminam em `last_competencia`, da mais antiga para a mais nova."""
    return [shift_competencia(last_competencia, offset) for offset in range(1 - count, 1)]


def build_point(competencia: str, totals: MonthlyTotals | None) -> MonthlyPointDTO:
    """Ponto da série; mês sem faturamento vira zero e fica sem tarifa média."""
    volume = 0.0 if totals is None else totals.volume_kwh
    revenue = 0.0 if totals is None else totals.receita_rs
    average_tariff = safe_ratio(revenue, volume)
    return MonthlyPointDTO(
        competencia=competencia,
        volume_kwh=round(volume, CASAS_DECIMAIS),
        receita_rs=round(revenue, CASAS_DECIMAIS),
        tarifa_media_rs_kwh=None if average_tariff is None else round(average_tariff, CASAS_TARIFA),
    )


def build_history(request: NeighborhoodHistoryRequest, totals: Sequence[MonthlyTotals]) -> NeighborhoodHistoryDTO:
    """Monta a série mensal contínua do bairro, preenchendo com zero os meses sem faturamento.

    Args:
        request: Bairro pedido, última competência e quantidade de meses.
        totals: Volume e receita por competência, na janela pedida (podem faltar meses).

    Returns:
        Uma linha por competência, da mais antiga para a mais nova, com volume, receita e tarifa média.
    """
    by_month = {month_totals.competencia: month_totals for month_totals in totals}
    competencias = competencias_until(request.competencia_fim, request.meses)
    return NeighborhoodHistoryDTO(
        municipio=request.municipio,
        bairro=request.bairro,
        classe_consumo=request.classe_consumo,
        pontos=[build_point(competencia, by_month.get(competencia)) for competencia in competencias],
    )