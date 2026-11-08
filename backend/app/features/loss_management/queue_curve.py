"""Curva de retorno acumulado da fila: o que cada inspeção a mais acrescenta e onde parar pelo custo da visita."""

import math
from collections.abc import Sequence
from itertools import takewhile

from pydantic import BaseModel, Field

from app.features.loss_management.schemas import SuspiciousUnitDTO

KWH_DECIMALS = 1
VALUE_DECIMALS = 2


class ReturnCurvePointDTO(BaseModel):
    """Retorno esperado somado das primeiras `posicao` UCs livres da fila."""

    posicao: int = Field(description="Quantas UCs livres, da primeira da fila até esta, entram na soma")
    kwh_mes_acumulado: float = Field(description="Soma de energia recuperável x chance de acerto, em kWh/mês")
    valor_ano_acumulado_rs: float = Field(description="Mesma soma em R$/ano, pela tarifa de referência")


class ReturnCurveDTO(BaseModel):
    """Curva de retorno esperado por número de inspeções e o corte sugerido para um custo por inspeção."""

    total_ucs: int = Field(description="UCs livres na fila (sem ordem ativa)")
    tarifa_rs_kwh: float | None = Field(default=None, description="Tarifa de referência do R$/ano")
    custo_inspecao_rs: float | None = Field(default=None, description="Custo por inspeção informado; vazio sem custo")
    corte_sugerido: int | None = Field(
        default=None,
        description="Quantas UCs inspecionar enquanto o retorno esperado em R$/ano de cada uma cobre o custo",
    )
    pontos: list[ReturnCurvePointDTO]


def _sampled_positions(total: int, max_points: int) -> set[int]:
    """Posições da curva: todas se couberem em `max_points`; senão de `passo` em `passo`, sempre com a última."""
    if total <= max_points:
        return set(range(1, total + 1))
    step = math.ceil(total / max_points)
    return {*range(step, total + 1, step), total}


def _suggested_cut(units: Sequence[SuspiciousUnitDTO], cost_rs: float | None) -> int | None:
    """Conta as UCs seguidas, do topo, cujo retorno esperado em R$/ano ainda cobre o custo da inspeção."""
    if cost_rs is None:
        return None
    expected_returns = (unit.valor_ano_rs * unit.probabilidade_acerto for unit in units)
    return sum(1 for _ in takewhile(lambda expected_return: expected_return >= cost_rs, expected_returns))


def build_return_curve(
    units: Sequence[SuspiciousUnitDTO],
    cost_rs: float | None,
    max_points: int,
    tariff_rs_kwh: float | None = None,
) -> ReturnCurveDTO:
    """Soma o retorno esperado (valor da UC x chance de acerto) UC a UC, na ordem da fila.

    A fila já vem em ordem decrescente de kWh esperado, e o R$/ano esperado segue a mesma ordem (a tarifa é única),
    então o retorno marginal nunca sobe e o corte sugerido é um prefixo da fila.

    Args:
        units: UCs livres na fila, na ordem de prioridade.
        cost_rs: Custo de uma inspeção em R$; None não sugere corte.
        max_points: Máximo de pontos devolvidos; a curva é reduzida mantendo sempre a última posição.
        tariff_rs_kwh: Tarifa de referência, devolvida para a tela explicar o R$/ano.

    Returns:
        A curva reduzida, o total de UCs e o corte sugerido (None sem custo).
    """
    kept_positions = _sampled_positions(len(units), max_points)
    kwh_total = 0.0
    value_total = 0.0
    points: list[ReturnCurvePointDTO] = []
    for position, unit in enumerate(units, start=1):
        kwh_total += unit.kwh_mes_recuperavel * unit.probabilidade_acerto
        value_total += unit.valor_ano_rs * unit.probabilidade_acerto
        if position in kept_positions:
            points.append(
                ReturnCurvePointDTO(
                    posicao=position,
                    kwh_mes_acumulado=round(kwh_total, KWH_DECIMALS),
                    valor_ano_acumulado_rs=round(value_total, VALUE_DECIMALS),
                )
            )
    return ReturnCurveDTO(
        total_ucs=len(units),
        tarifa_rs_kwh=tariff_rs_kwh,
        custo_inspecao_rs=cost_rs,
        corte_sugerido=_suggested_cut(units, cost_rs),
        pontos=points,
    )
