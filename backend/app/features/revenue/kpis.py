from dataclasses import dataclass

from app.features.revenue.schemas import KpiValueDTO, RevenueKpisDTO

CASAS_VALOR = 2
CASAS_TARIFA = 4
CASAS_PERCENTUAL = 1


@dataclass(frozen=True, slots=True)
class WindowTotals:
    """Totais de faturamento de uma janela de competências."""

    receita_rs: float
    volume_kwh: float
    faturas: int
    ucs_ativas: int


@dataclass(frozen=True, slots=True)
class PeriodTotals:
    """Totais da janela base e da janela atual, lidos do banco em uma única consulta."""

    base: WindowTotals
    current: WindowTotals


def safe_ratio(numerator: float, denominator: float) -> float | None:
    """Divide dois valores e devolve None quando o denominador não é positivo."""
    if denominator <= 0:
        return None
    return numerator / denominator


def kpi_value(base: float | None, current: float | None, digits: int = CASAS_VALOR) -> KpiValueDTO:
    """Monta o indicador com a variação percentual entre a janela base e a atual.

    Args:
        base: Valor na janela base (None quando não há como calcular).
        current: Valor na janela atual (None quando não há como calcular).
        digits: Casas decimais dos valores; a variação percentual usa sempre uma casa.

    Returns:
        O indicador; a variação fica em None quando falta um dos valores ou a base não é positiva.
    """
    if base is None or current is None:
        return KpiValueDTO(
            base=None if base is None else round(base, digits),
            atual=None if current is None else round(current, digits),
        )
    change_pct = safe_ratio(current - base, base)
    return KpiValueDTO(
        base=round(base, digits),
        atual=round(current, digits),
        variacao_pct=None if change_pct is None else round(change_pct * 100, CASAS_PERCENTUAL),
    )


def average_tariff(totals: WindowTotals) -> float | None:
    """Tarifa média ponderada pelo volume (receita dividida pelo volume faturado)."""
    return safe_ratio(totals.receita_rs, totals.volume_kwh)


def average_ticket(totals: WindowTotals) -> float | None:
    """Ticket médio mensal por UC (receita dividida pelo número de faturas, uma por UC por competência)."""
    return safe_ratio(totals.receita_rs, totals.faturas)


def build_kpis(totals: PeriodTotals) -> RevenueKpisDTO:
    """Calcula os cinco indicadores executivos a partir dos totais das duas janelas.

    Args:
        totals: Receita, volume, faturas e UCs ativas da janela base e da janela atual.

    Returns:
        Faturamento, volume, tarifa média, ticket médio e UCs ativas, cada um com a variação percentual.
    """
    base, current = totals.base, totals.current
    return RevenueKpisDTO(
        faturamento_rs=kpi_value(base.receita_rs, current.receita_rs),
        volume_kwh=kpi_value(base.volume_kwh, current.volume_kwh),
        tarifa_media_rs_kwh=kpi_value(average_tariff(base), average_tariff(current), CASAS_TARIFA),
        ticket_medio_rs=kpi_value(average_ticket(base), average_ticket(current)),
        ucs_ativas=kpi_value(base.ucs_ativas, current.ucs_ativas, 0),
    )