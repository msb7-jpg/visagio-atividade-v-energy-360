"""Cálculo puro dos indicadores do Painel: valores por janela, variação e avaliação."""

from collections.abc import Callable
from dataclasses import dataclass

from app.features.executive_dashboard.schemas import (
    IndicatorDetailDTO,
    IndicatorDirection,
    IndicatorDTO,
    IndicatorEvaluation,
    IndicatorUnit,
)
from app.features.revenue.kpis import WindowTotals, kpi_value, safe_ratio
from app.features.revenue.schemas import PeriodWindow

LIMIAR_ESTAVEL_PCT = 1.0
LIMIAR_ESTAVEL_PP = 0.1
COMPETENCIA_TEMPORAL = "2025-07"
AVISO_TEMPORAL = (
    "Jul/2025 teve um temporal com cerca de 5 vezes mais interrupções que a média, quase todas por causa "
    "climática. Esse mês pesa muito no período que o contém."
)
CASAS_POR_UNIDADE = {
    IndicatorUnit.RS: 2,
    IndicatorUnit.KWH: 2,
    IndicatorUnit.RS_KWH: 4,
    IndicatorUnit.UCS: 0,
    IndicatorUnit.PCT: 2,
    IndicatorUnit.NOTA: 2,
    IndicatorUnit.HORAS: 2,
    IndicatorUnit.VEZES: 2,
}


@dataclass(frozen=True, slots=True)
class AreaTotals:
    """Totais de cobrança, rede, atendimento e medição de uma janela de competências."""

    valor_faturado_rs: float
    valor_vencido_rs: float
    interrupcoes: int
    horas_interrompidas: float
    nota_media_csat: float | None
    tempo_medio_resolucao_h: float | None
    leituras: int
    leituras_estimadas: int
    ucs_com_gd: int
    ucs_atendidas: int = 0


@dataclass(frozen=True, slots=True)
class WindowSnapshot:
    """Tudo o que o Painel lê de uma janela: os totais de receita da Fatia 04 e os das demais áreas."""

    revenue: WindowTotals
    areas: AreaTotals


@dataclass(frozen=True, slots=True)
class PeriodSnapshots:
    """Retratos da janela base e da janela atual."""

    base_window: PeriodWindow
    current_window: PeriodWindow
    base: WindowSnapshot
    current: WindowSnapshot


@dataclass(frozen=True, slots=True)
class DetailSpec:
    """Valor de apoio de um indicador, medido nas mesmas janelas."""

    titulo: str
    unidade: IndicatorUnit
    measure: Callable[[WindowSnapshot], float | None]


@dataclass(frozen=True, slots=True)
class IndicatorSpec:
    """Definição de um indicador: como é medido em uma janela e em que sentido ele é bom."""

    id: str
    titulo: str
    unidade: IndicatorUnit
    sentido: IndicatorDirection
    explicacao: str
    measure: Callable[[WindowSnapshot], float | None]
    afetado_pelo_temporal: bool = False
    detalhe: DetailSpec | None = None


def percent(part: float, whole: float) -> float | None:
    """Parte sobre o todo, em %; None quando o todo não é positivo."""
    ratio = safe_ratio(part, whole)
    return None if ratio is None else ratio * 100


def evaluate(
    direction: IndicatorDirection, change: float | None, threshold: float = LIMIAR_ESTAVEL_PCT
) -> IndicatorEvaluation:
    """Diz se o indicador melhorou, piorou ou ficou estável entre as janelas.

    Args:
        direction: Sentido em que o indicador é bom para a empresa.
        change: Variação entre a janela base e a atual (em % ou em pontos percentuais).
        threshold: Variação, em módulo, abaixo da qual o indicador é estável.

    Returns:
        Indicador neutro é sempre informativo; sem variação, sem comparação; abaixo do limiar, estável.
    """
    if direction is IndicatorDirection.NEUTRO:
        return IndicatorEvaluation.INFORMATIVO
    if change is None:
        return IndicatorEvaluation.SEM_COMPARACAO
    if abs(change) < threshold:
        return IndicatorEvaluation.ESTAVEL
    went_up = change > 0
    improved = went_up if direction is IndicatorDirection.MAIOR_MELHOR else not went_up
    return IndicatorEvaluation.MELHOROU if improved else IndicatorEvaluation.PIOROU


def contains_storm(window: PeriodWindow) -> bool:
    """Indica se a janela contém o mês do temporal (jul/2025)."""
    return window.competencia_inicio <= COMPETENCIA_TEMPORAL <= window.competencia_fim


def percentage_points(base: float | None, current: float | None) -> float | None:
    """Diferença entre duas taxas em pontos percentuais; None quando falta uma delas."""
    if base is None or current is None:
        return None
    return round(current - base, CASAS_POR_UNIDADE[IndicatorUnit.PCT])


def build_detail(detail: DetailSpec | None, snapshots: PeriodSnapshots) -> IndicatorDetailDTO | None:
    """Mede o valor de apoio nas duas janelas, arredondado pela unidade; None se o indicador não tem."""
    if detail is None:
        return None
    digits = CASAS_POR_UNIDADE[detail.unidade]
    value = kpi_value(detail.measure(snapshots.base), detail.measure(snapshots.current), digits)
    return IndicatorDetailDTO(titulo=detail.titulo, unidade=detail.unidade, base=value.base, atual=value.atual)


def build_indicator(spec: IndicatorSpec, snapshots: PeriodSnapshots) -> IndicatorDTO:
    """Mede o indicador nas duas janelas e monta a resposta com variação, avaliação e aviso.

    Indicadores em % são avaliados pela diferença em pontos percentuais (ADR-011).

    Args:
        spec: Definição do indicador.
        snapshots: Totais da janela base e da janela atual.

    Returns:
        O indicador com os valores arredondados pela unidade e a variação com uma casa decimal.
    """
    base_value, current_value = spec.measure(snapshots.base), spec.measure(snapshots.current)
    value = kpi_value(base_value, current_value, CASAS_POR_UNIDADE[spec.unidade])
    is_rate = spec.unidade is IndicatorUnit.PCT
    points = percentage_points(base_value, current_value) if is_rate else None
    evaluation = (
        evaluate(spec.sentido, points, LIMIAR_ESTAVEL_PP) if is_rate else evaluate(spec.sentido, value.variacao_pct)
    )
    storm_in_period = contains_storm(snapshots.base_window) or contains_storm(snapshots.current_window)
    return IndicatorDTO(
        id=spec.id,
        titulo=spec.titulo,
        unidade=spec.unidade,
        base=value.base,
        atual=value.atual,
        variacao_pct=value.variacao_pct,
        variacao_pp=points,
        sentido=spec.sentido,
        avaliacao=evaluation,
        explicacao=spec.explicacao,
        detalhe=build_detail(spec.detalhe, snapshots),
        aviso=AVISO_TEMPORAL if spec.afetado_pelo_temporal and storm_in_period else None,
    )
