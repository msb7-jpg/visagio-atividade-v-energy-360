"""Tarifa média da base: receita faturada dividida pela energia faturada dos últimos 12 meses (decisão P4)."""

from dataclasses import dataclass

from app.shared.exceptions import DatabaseReadError

TARIFA_CASAS_DECIMAIS = 4
EMPTY_BILLING_MESSAGE = (
    "Não há faturas com energia faturada nos últimos 12 meses em fato_faturamento; "
    "não é possível calcular a tarifa média da Fila de Inspeção."
)


@dataclass(frozen=True, slots=True)
class AverageTariff:
    """Tarifa média ponderada pelo consumo e o período de faturamento que a originou."""

    rs_per_kwh: float
    period_start: str  # primeira competência incluída ('YYYY-MM')
    period_end: str  # última competência incluída ('YYYY-MM')


def compute_average_tariff(
    revenue_rs: float | None, energy_kwh: float | None, period_start: str, period_end: str
) -> AverageTariff:
    """Calcula a tarifa média ponderada: a soma da receita sobre a soma da energia, e não a média das tarifas.

    Args:
        revenue_rs: Soma de `valor_total_rs` no período.
        energy_kwh: Soma de `consumo_faturado_kwh` no período.
        period_start: Primeira competência do período ('YYYY-MM').
        period_end: Última competência do período ('YYYY-MM').

    Returns:
        A tarifa em R$/kWh, arredondada, com o período.

    Raises:
        DatabaseReadError: Se não há energia faturada no período (tabela vazia ou só consumo zerado).
    """
    if energy_kwh is None or energy_kwh <= 0 or revenue_rs is None:
        raise DatabaseReadError(EMPTY_BILLING_MESSAGE)
    return AverageTariff(
        rs_per_kwh=round(revenue_rs / energy_kwh, TARIFA_CASAS_DECIMAIS),
        period_start=period_start,
        period_end=period_end,
    )
