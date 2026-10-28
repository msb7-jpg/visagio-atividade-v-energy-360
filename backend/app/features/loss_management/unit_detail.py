"""Regras puras do detalhe de uma UC: série de 12 meses, frase do motivo, decomposição do score e histórico."""

from collections.abc import Mapping

from app.features.loss_management.detail_schemas import (
    MonthlyConsumptionDTO,
    PriorInspectionDTO,
    ScoreBreakdownDTO,
)
from app.features.loss_management.queries import MESES_JANELA_BASE, MESES_JANELA_RECENTE, shift_competencia
from app.features.loss_management.schemas import SuspicionReason, SuspiciousUnitDTO
from app.features.loss_management.scoring import (
    JANELA_RECUPERACAO_MESES,
    ConsumptionProfile,
    consumption_drop_ratio,
    priority_key,
)

MESES_SERIE = 12
PERCENT = 100
DROP_REASONS = frozenset({SuspicionReason.QUEDA_SUBITA, SuspicionReason.QUEDA_MODERADA})


def series_competencias(reference_competencia: str) -> list[str]:
    """Lista as 12 competências da série, em ordem crescente, terminando na de referência.

    Args:
        reference_competencia: Última competência da análise ('YYYY-MM').

    Returns:
        As 12 competências, com a de referência por último.
    """
    return [shift_competencia(reference_competencia, -offset) for offset in range(MESES_SERIE - 1, -1, -1)]


def fill_monthly_series(
    competencias: list[str], consumption_by_competencia: Mapping[str, float]
) -> list[MonthlyConsumptionDTO]:
    """Monta a série sem buracos: mês sem leitura válida vira `None`, nunca zero.

    Args:
        competencias: Competências da série, em ordem.
        consumption_by_competencia: Consumo dos meses que têm leitura válida.

    Returns:
        Um ponto por competência, na mesma ordem.
    """
    return [
        MonthlyConsumptionDTO(competencia=competencia, consumo_kwh=consumption_by_competencia.get(competencia))
        for competencia in competencias
    ]


def format_kwh(value: float) -> str:
    """Formata kWh no padrão pt-BR (ponto de milhar, sem decimais)."""
    return f"{value:,.0f}".replace(",", ".")


def explain_reasons(profile: ConsumptionProfile, reasons: list[SuspicionReason]) -> str:
    """Escreve em pt-BR, só com os números reais da UC, por que ela está na fila.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.
        reasons: Motivos de suspeita detectados.

    Returns:
        Uma ou duas frases curtas; vazio se nenhum motivo se aplica.
    """
    sentences: list[str] = []
    if DROP_REASONS & set(reasons):
        drop_percent = round(consumption_drop_ratio(profile) * PERCENT)
        sentences.append(
            f"Consumo médio de {format_kwh(profile.consumo_recente_kwh)} kWh/mês nas {MESES_JANELA_RECENTE} últimas "
            f"competências, {drop_percent}% abaixo da média de {format_kwh(profile.consumo_base_kwh)} kWh/mês do "
            f"período anterior (até {MESES_JANELA_BASE} competências)."
        )
    if SuspicionReason.LEITURA_ZERADA in reasons:
        zero_months = profile.meses_zerados
        month_word = "mês" if zero_months == 1 else "meses"
        sentences.append(
            f"{zero_months} {month_word} com leitura zerada nas {MESES_JANELA_RECENTE} últimas competências."
        )
    return " ".join(sentences)


def build_score_breakdown(unit: SuspiciousUnitDTO, top_expected_kwh: float) -> ScoreBreakdownDTO:
    """Expõe os números que compõem o score da UC, os mesmos usados para ordenar e normalizar a fila.

    Args:
        unit: Item da fila já com o `score` calculado sobre todas as candidatas.
        top_expected_kwh: Maior kWh esperado da fila, o denominador do score.

    Returns:
        Energia recuperável, chance de acerto, kWh esperado, o topo da fila e o score.
    """
    expected_kwh, _ = priority_key(unit)
    return ScoreBreakdownDTO(
        kwh_mes_recuperavel=unit.kwh_mes_recuperavel,
        meses_janela_recuperacao=JANELA_RECUPERACAO_MESES,
        kwh_janela_recuperavel=unit.kwh_estimado_recuperar,
        probabilidade_acerto=unit.probabilidade_acerto,
        kwh_esperado=round(expected_kwh, 2),
        maior_kwh_esperado_fila=round(top_expected_kwh, 2),
        score=unit.score,
    )


def sort_prior_inspections(inspections: list[PriorInspectionDTO]) -> list[PriorInspectionDTO]:
    """Ordena da inspeção mais recente para a mais antiga; as sem data vão para o fim.

    Args:
        inspections: Inspeções do histórico de campo e das ordens concluídas.

    Returns:
        Nova lista ordenada.
    """
    dated = [inspection for inspection in inspections if inspection.data_inspecao is not None]
    undated = [inspection for inspection in inspections if inspection.data_inspecao is None]
    return [*sorted(dated, key=lambda inspection: inspection.data_inspecao, reverse=True), *undated]
