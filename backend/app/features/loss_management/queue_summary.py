"""Regras puras dos cartões da Fila de Inspeção: situação da UC, taxa histórica e resumo da seleção."""

from dataclasses import dataclass

from app.features.loss_management.hit_rate import TAXA_ACERTO_GERAL
from app.features.loss_management.schemas import (
    FILA_CAPACIDADE_MENSAL,
    HitRateDTO,
    InspectionStatus,
    QueueSituation,
    QueueSummaryDTO,
    SuspiciousUnitDTO,
)
from app.features.loss_management.tariff import AverageTariff

SITUATION_BY_ORDER_STATUS = {
    InspectionStatus.GERADA: QueueSituation.ORDEM_GERADA,
    InspectionStatus.PENDENTE: QueueSituation.EM_CAMPO,
}
COMPETENCIA_LENGTH = len("YYYY-MM")


@dataclass(frozen=True, slots=True)
class FieldHitRate:
    """Contagens de `fato_inspecoes_perdas`: inspeções feitas, com irregularidade confirmada, e o período coberto."""

    total: int
    confirmed: int
    first_date: str | None
    last_date: str | None


def situation_of(unit: SuspiciousUnitDTO, active_orders: dict[str, InspectionStatus]) -> QueueSituation:
    """Resolve a situação da UC a partir da sua ordem ativa.

    Args:
        unit: Item da fila.
        active_orders: Status da ordem ativa por `id_uc`.

    Returns:
        Ordem gerada, em campo, ou "na fila" quando a UC não tem ordem ativa.
    """
    order_status = active_orders.get(unit.id_uc)
    if order_status is None:
        return QueueSituation.NA_FILA
    return SITUATION_BY_ORDER_STATUS.get(order_status, QueueSituation.NA_FILA)


def apply_situation(
    units: list[SuspiciousUnitDTO], active_orders: dict[str, InspectionStatus]
) -> list[SuspiciousUnitDTO]:
    """Marca cada UC com a situação da sua ordem ativa; sem ordem ativa ela segue "na fila".

    Args:
        units: Itens da fila.
        active_orders: Status da ordem ativa por `id_uc`.

    Returns:
        Novos itens com `situacao` preenchida, na mesma ordem.
    """
    return [unit.model_copy(update={"situacao": situation_of(unit, active_orders)}) for unit in units]


def hit_rate_dto(rate: FieldHitRate | None) -> HitRateDTO:
    """Converte as contagens do histórico de campo na taxa de acerto exibida.

    Args:
        rate: Contagens do histórico; None se a tabela de inspeções ainda não foi exportada.

    Returns:
        A taxa confirmadas / total; sem histórico usa a taxa geral já medida e deixa as contagens vazias.
    """
    if rate is None or rate.total == 0:
        return HitRateDTO(
            inspecoes_total=None,
            irregularidades_confirmadas=None,
            taxa=TAXA_ACERTO_GERAL,
            periodo_inicio=None,
            periodo_fim=None,
        )
    return HitRateDTO(
        inspecoes_total=rate.total,
        irregularidades_confirmadas=rate.confirmed,
        taxa=round(rate.confirmed / rate.total, 4),
        periodo_inicio=rate.first_date[:COMPETENCIA_LENGTH] if rate.first_date else None,
        periodo_fim=rate.last_date[:COMPETENCIA_LENGTH] if rate.last_date else None,
    )


def expected_return(selected_units: list[SuspiciousUnitDTO]) -> tuple[float, float]:
    """Soma o retorno esperado das UCs selecionadas, cada uma com a sua chance de acerto.

    Args:
        selected_units: UCs selecionadas que ainda estão na fila.

    Returns:
        Energia esperada (kWh/mês) e valor esperado (R$/ano): soma de recuperável x `probabilidade_acerto` por UC.
    """
    expected_kwh = sum(unit.kwh_mes_recuperavel * unit.probabilidade_acerto for unit in selected_units)
    expected_value_rs = sum(unit.valor_ano_rs * unit.probabilidade_acerto for unit in selected_units)
    return expected_kwh, expected_value_rs


def build_queue_summary(
    selected_units: list[SuspiciousUnitDTO], scheduled_orders: int, hit_rate: HitRateDTO, tariff: AverageTariff
) -> QueueSummaryDTO:
    """Calcula os cartões do topo para as UCs selecionadas.

    Args:
        selected_units: UCs selecionadas que ainda estão na fila (sem ordem).
        scheduled_orders: Ordens ativas (geradas ou em campo).
        hit_rate: Taxa histórica de acerto.
        tariff: Tarifa média da base e seu período, já usada para valorar as UCs selecionadas.

    Returns:
        Capacidade, energia e valor das selecionadas e retorno esperado (soma de energia x chance de acerto por UC).
    """
    expected_kwh, expected_value_rs = expected_return(selected_units)
    monthly_kwh = sum(unit.kwh_mes_recuperavel for unit in selected_units)
    annual_value_rs = sum(unit.valor_ano_rs for unit in selected_units)
    return QueueSummaryDTO(
        capacidade_total=FILA_CAPACIDADE_MENSAL,
        capacidade_programada=scheduled_orders,
        selecionadas=len(selected_units),
        kwh_mes_selecionadas=round(monthly_kwh, 1),
        valor_ano_selecionadas_rs=round(annual_value_rs, 2),
        tarifa_rs_kwh=tariff.rs_per_kwh,
        tarifa_periodo_inicio=tariff.period_start,
        tarifa_periodo_fim=tariff.period_end,
        retorno_esperado_kwh_mes=round(expected_kwh, 1),
        retorno_esperado_valor_ano_rs=round(expected_value_rs, 2),
        taxa_acerto=hit_rate,
    )
