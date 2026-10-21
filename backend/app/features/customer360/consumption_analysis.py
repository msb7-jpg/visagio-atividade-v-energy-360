"""Cálculos puros da comparação de consumo ano contra ano (YoY) e do diagnóstico de conta alta."""

from dataclasses import dataclass

from app.features.customer360.schemas import (
    ConsumptionTrend,
    HighBillDiagnosisDTO,
    InvoiceDTO,
    MeasurementDTO,
    MonthlyComparisonDTO,
)

JANELA_MESES = 12
LIMIAR_VARIACAO_CONSUMO_PCT = 10.0


@dataclass(frozen=True, slots=True)
class MonthSnapshot:
    """Valores de uma competência usados na comparação: leitura, período faturado e fatura."""

    kwh: float | None
    days: int | None
    daily_kwh: float | None
    amount: float | None
    tariff: float | None
    flag: str | None


def shift_competencia(competencia: str, months: int) -> str:
    """Desloca uma competência no calendário.

    Args:
        competencia: Mês de referência no formato 'YYYY-MM'.
        months: Quantidade de meses a deslocar; negativo volta no tempo.

    Returns:
        Competência resultante no formato 'YYYY-MM'.
    """
    year_text, month_text = competencia.split("-")
    absolute_month = int(year_text) * 12 + int(month_text) - 1 + months
    shifted_year, shifted_month_index = divmod(absolute_month, 12)
    return f"{shifted_year:04d}-{shifted_month_index + 1:02d}"


def percent_change(current: float | None, previous: float | None) -> float | None:
    """Calcula a variação percentual de `previous` para `current`.

    Args:
        current: Valor do período atual.
        previous: Valor do período base.

    Returns:
        Variação em pontos percentuais com uma casa decimal, ou None se algum valor faltar ou a base for zero.
    """
    if current is None or previous is None or previous == 0:
        return None
    relative_change = (current - previous) / previous
    return round(relative_change * 100, 1)


def classify_trend(variation_pct: float | None) -> ConsumptionTrend:
    """Classifica a variação de consumo usando o limiar `LIMIAR_VARIACAO_CONSUMO_PCT`.

    Args:
        variation_pct: Variação percentual do consumo contra o ano anterior.

    Returns:
        SUBIU, CAIU, ESTAVEL ou SEM_COMPARACAO quando não há base de comparação.
    """
    if variation_pct is None:
        return ConsumptionTrend.SEM_COMPARACAO
    if variation_pct > LIMIAR_VARIACAO_CONSUMO_PCT:
        return ConsumptionTrend.SUBIU
    if variation_pct < -LIMIAR_VARIACAO_CONSUMO_PCT:
        return ConsumptionTrend.CAIU
    return ConsumptionTrend.ESTAVEL


def daily_average(kwh: float | None, days: int | None) -> float | None:
    """Consumo médio por dia do período faturado.

    Args:
        kwh: Consumo medido no período.
        days: Dias do período de faturamento.

    Returns:
        kWh por dia com duas casas, ou None se faltar dado ou o período for zero.
    """
    if kwh is None or not days:
        return None
    return round(kwh / days, 2)


def snapshot_month(
    month: str, measurements_by_month: dict[str, MeasurementDTO], invoices_by_month: dict[str, InvoiceDTO]
) -> MonthSnapshot:
    """Reúne leitura e fatura de uma competência num retrato único.

    Args:
        month: Competência 'YYYY-MM'.
        measurements_by_month: Leituras indexadas por competência.
        invoices_by_month: Faturas indexadas por competência.

    Returns:
        Retrato do mês; campos ausentes ficam None.
    """
    measurement = measurements_by_month.get(month)
    invoice = invoices_by_month.get(month)
    kwh = measurement.consumo_kwh if measurement else None
    days = measurement.dias_faturamento if measurement else None
    return MonthSnapshot(
        kwh=kwh,
        days=days,
        daily_kwh=daily_average(kwh, days),
        amount=invoice.valor_total_rs if invoice else None,
        tariff=invoice.tarifa_aplicada_rs_kwh if invoice else None,
        flag=invoice.bandeira_tarifaria if invoice else None,
    )


def build_monthly_comparison(
    reference: str,
    measurements_by_month: dict[str, MeasurementDTO],
    invoices_by_month: dict[str, InvoiceDTO],
) -> list[MonthlyComparisonDTO]:
    """Monta a janela de 12 meses terminada em `reference`, cada mês ao lado do mesmo mês do ano anterior.

    Args:
        reference: Competência mais recente da janela ('YYYY-MM').
        measurements_by_month: Leituras indexadas por competência.
        invoices_by_month: Faturas indexadas por competência.

    Returns:
        Doze comparações em ordem cronológica; meses sem dado ficam com valores None.
    """
    window_months = [shift_competencia(reference, offset) for offset in range(-(JANELA_MESES - 1), 1)]
    return [_compare_month(month, measurements_by_month, invoices_by_month) for month in window_months]


def _compare_month(
    month: str, measurements_by_month: dict[str, MeasurementDTO], invoices_by_month: dict[str, InvoiceDTO]
) -> MonthlyComparisonDTO:
    previous_month = shift_competencia(month, -JANELA_MESES)
    current = snapshot_month(month, measurements_by_month, invoices_by_month)
    previous = snapshot_month(previous_month, measurements_by_month, invoices_by_month)
    return MonthlyComparisonDTO(
        competencia=month,
        competencia_ano_anterior=previous_month,
        consumo_kwh=current.kwh,
        consumo_kwh_ano_anterior=previous.kwh,
        variacao_consumo_pct=percent_change(current.kwh, previous.kwh),
        valor_total_rs=current.amount,
        valor_total_rs_ano_anterior=previous.amount,
        variacao_valor_pct=percent_change(current.amount, previous.amount),
        bandeira_tarifaria=current.flag,
        dias_faturamento=current.days,
        dias_faturamento_ano_anterior=previous.days,
        media_diaria_kwh=current.daily_kwh,
        media_diaria_kwh_ano_anterior=previous.daily_kwh,
        variacao_media_diaria_pct=percent_change(current.daily_kwh, previous.daily_kwh),
        tarifa_rs_kwh=current.tariff,
        tarifa_rs_kwh_ano_anterior=previous.tariff,
        variacao_tarifa_pct=percent_change(current.tariff, previous.tariff),
    )


def diagnose_high_bill(
    reference_month: MonthlyComparisonDTO, invoices_by_month: dict[str, InvoiceDTO]
) -> HighBillDiagnosisDTO:
    """Explica a conta do mês de referência pelas quatro causas: consumo, dias faturados, bandeira e tarifa.

    Args:
        reference_month: Comparação do mês de referência contra o ano anterior.
        invoices_by_month: Faturas indexadas por competência, para ler a bandeira do ano anterior.

    Returns:
        Diagnóstico estruturado; a redação da mensagem ao atendente fica a cargo do frontend.
    """
    previous_invoice = invoices_by_month.get(reference_month.competencia_ano_anterior)
    previous_flag = previous_invoice.bandeira_tarifaria if previous_invoice else None
    current_flag = reference_month.bandeira_tarifaria
    flag_changed = current_flag is not None and previous_flag is not None and current_flag != previous_flag
    return HighBillDiagnosisDTO(
        competencia_referencia=reference_month.competencia,
        competencia_comparada=reference_month.competencia_ano_anterior,
        consumo_kwh=reference_month.consumo_kwh,
        consumo_kwh_ano_anterior=reference_month.consumo_kwh_ano_anterior,
        variacao_consumo_pct=reference_month.variacao_consumo_pct,
        tendencia_consumo=classify_trend(reference_month.variacao_consumo_pct),
        bandeira_atual=current_flag,
        bandeira_ano_anterior=previous_flag,
        bandeira_mudou=flag_changed,
        dias_faturamento=reference_month.dias_faturamento,
        dias_faturamento_ano_anterior=reference_month.dias_faturamento_ano_anterior,
        media_diaria_kwh=reference_month.media_diaria_kwh,
        media_diaria_kwh_ano_anterior=reference_month.media_diaria_kwh_ano_anterior,
        variacao_media_diaria_pct=reference_month.variacao_media_diaria_pct,
        tendencia_media_diaria=classify_trend(reference_month.variacao_media_diaria_pct),
        tarifa_rs_kwh=reference_month.tarifa_rs_kwh,
        tarifa_rs_kwh_ano_anterior=reference_month.tarifa_rs_kwh_ano_anterior,
        variacao_tarifa_pct=reference_month.variacao_tarifa_pct,
    )


def latest_competencia(measurements: list[MeasurementDTO]) -> str | None:
    """Encontra a competência mais recente com leitura registrada.

    Args:
        measurements: Leituras da UC.

    Returns:
        Competência 'YYYY-MM' mais recente, ou None se não houver leituras.
    """
    return max((measurement.competencia for measurement in measurements), default=None)
