"""Totais dos últimos 12 meses contra os mesmos meses do ano anterior."""

from app.features.customer360.consumption_analysis import percent_change
from app.features.customer360.schemas import MonthlyComparisonDTO, YearOverYearTotalsDTO


def summarize_window(months: list[MonthlyComparisonDTO]) -> YearOverYearTotalsDTO | None:
    """Soma consumo e valor da janela usando só os meses que existem nos dois anos.

    Somar apenas meses comparáveis evita distorcer a variação quando a UC é recente ou tem leitura faltando.

    Args:
        months: Comparações mensais da janela de 12 meses.

    Returns:
        Totais e variações da janela, ou None se nenhum mês tiver comparação.
    """
    comparable_kwh = [
        month for month in months if month.consumo_kwh is not None and month.consumo_kwh_ano_anterior is not None
    ]
    if not comparable_kwh:
        return None
    current_kwh = sum(month.consumo_kwh or 0.0 for month in comparable_kwh)
    previous_kwh = sum(month.consumo_kwh_ano_anterior or 0.0 for month in comparable_kwh)
    comparable_amount = [
        month for month in months if month.valor_total_rs is not None and month.valor_total_rs_ano_anterior is not None
    ]
    current_amount = round(sum(month.valor_total_rs or 0.0 for month in comparable_amount), 2)
    previous_amount = round(sum(month.valor_total_rs_ano_anterior or 0.0 for month in comparable_amount), 2)
    has_amounts = len(comparable_amount) > 0
    return YearOverYearTotalsDTO(
        meses_comparados=len(comparable_kwh),
        consumo_kwh=round(current_kwh, 1),
        consumo_kwh_ano_anterior=round(previous_kwh, 1),
        variacao_consumo_pct=percent_change(current_kwh, previous_kwh),
        valor_total_rs=current_amount if has_amounts else None,
        valor_total_rs_ano_anterior=previous_amount if has_amounts else None,
        variacao_valor_pct=percent_change(current_amount, previous_amount) if has_amounts else None,
    )
