"""Regras puras de classificação, ranking e resumo de DEC/FEC por alimentador."""

from collections import Counter
from dataclasses import dataclass

from app.features.grid_quality.schemas import (
    FeederRankingDTO,
    FeederTimeSeriesPointDTO,
    QualityIndicatorsDTO,
    QualityStatus,
)

LIMIAR_ALERTA = 0.85
PERCENTUAL_TOTAL = 100.0


@dataclass(frozen=True, slots=True)
class FeederScope:
    """Conjunto elétrico, critério do limite e UCs do alimentador (denominador fixo do DEC/FEC)."""

    conjunto_aneel: str | None
    criterio_limite: str | None
    ucs_atendidas: int | None
    ucs_interrompidas: int | None


@dataclass(frozen=True, slots=True)
class FeederQualityRow:
    """DEC/FEC do mês e acumulado no ano de um alimentador, com os limites anuais lidos do dado."""

    id_alimentador: str
    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_acumulado_ano_horas: float
    fec_acumulado_ano_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None
    scope: FeederScope


def _exceeds_limit(applied: float, limit: float | None) -> bool:
    if limit is None or limit <= 0:
        return False
    return applied > limit


def _reaches_alert(applied: float, limit: float | None) -> bool:
    if limit is None or limit <= 0:
        return False
    return applied >= limit * LIMIAR_ALERTA


def _mean(values: list[float]) -> float:
    return sum(values) / len(values)


def _empty_indicators(competencia: str | None) -> QualityIndicatorsDTO:
    return QualityIndicatorsDTO(
        competencia=competencia,
        dec_medio_horas=0.0,
        fec_medio_vezes=0.0,
        total_alimentadores=0,
        alimentadores_em_violacao=0,
        percentual_violacao=0.0,
        alimentadores_em_alerta=0,
        percentual_alerta=0.0,
        alimentadores_conformes=0,
        percentual_conforme=0.0,
    )


def classify_status(row: FeederQualityRow) -> QualityStatus:
    """Classifica o alimentador pelo DEC e FEC acumulados no ano contra os limites anuais.

    VIOLACAO se o acumulado de DEC ou FEC excede o limite; ALERTA se atinge 85% do limite;
    CONFORME nos demais casos. Limite nulo ou menor ou igual a zero não gera violação nem alerta.

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        Status regulatório do alimentador.
    """
    exceeds_dec = _exceeds_limit(row.dec_acumulado_ano_horas, row.dec_limite_horas)
    exceeds_fec = _exceeds_limit(row.fec_acumulado_ano_vezes, row.fec_limite_vezes)
    if exceeds_dec or exceeds_fec:
        return QualityStatus.VIOLACAO
    alert_dec = _reaches_alert(row.dec_acumulado_ano_horas, row.dec_limite_horas)
    alert_fec = _reaches_alert(row.fec_acumulado_ano_vezes, row.fec_limite_vezes)
    if alert_dec or alert_fec:
        return QualityStatus.ALERTA
    return QualityStatus.CONFORME


def delta_dec(row: FeederQualityRow) -> float | None:
    """Calcula o excesso do DEC acumulado no ano sobre o limite anual (negativo quando abaixo).

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        DEC acumulado no ano menos o limite, ou None quando o limite é nulo ou menor ou igual a zero.
    """
    if row.dec_limite_horas is None or row.dec_limite_horas <= 0:
        return None
    return row.dec_acumulado_ano_horas - row.dec_limite_horas


def build_ranking_entry(row: FeederQualityRow) -> FeederRankingDTO:
    """Converte a apuração em entrada do ranking, com delta de DEC e status.

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        Entrada do ranking pronta para a camada de transporte.
    """
    return FeederRankingDTO(
        id_alimentador=row.id_alimentador,
        competencia=row.competencia,
        dec_apurado_horas=row.dec_apurado_horas,
        fec_apurado_vezes=row.fec_apurado_vezes,
        dec_acumulado_ano_horas=row.dec_acumulado_ano_horas,
        fec_acumulado_ano_vezes=row.fec_acumulado_ano_vezes,
        dec_limite_horas=row.dec_limite_horas,
        fec_limite_vezes=row.fec_limite_vezes,
        delta_dec_horas=delta_dec(row),
        status=classify_status(row),
        conjunto_aneel=row.scope.conjunto_aneel,
        criterio_limite=row.scope.criterio_limite,
        ucs_atendidas=row.scope.ucs_atendidas,
    )


def build_time_series_point(row: FeederQualityRow) -> FeederTimeSeriesPointDTO:
    """Converte a apuração mensal em ponto da série histórica.

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        Ponto da série com DEC/FEC do mês, acumulados no ano e limites anuais.
    """
    return FeederTimeSeriesPointDTO(
        competencia=row.competencia,
        dec_apurado_horas=row.dec_apurado_horas,
        fec_apurado_vezes=row.fec_apurado_vezes,
        dec_acumulado_ano_horas=row.dec_acumulado_ano_horas,
        fec_acumulado_ano_vezes=row.fec_acumulado_ano_vezes,
        dec_limite_horas=row.dec_limite_horas,
        fec_limite_vezes=row.fec_limite_vezes,
        conjunto_aneel=row.scope.conjunto_aneel,
        criterio_limite=row.scope.criterio_limite,
        ucs_atendidas=row.scope.ucs_atendidas,
    )


def _ranking_sort_key(entry: FeederRankingDTO) -> tuple[bool, float, str]:
    has_no_delta = entry.delta_dec_horas is None
    descending_delta = -(entry.delta_dec_horas or 0.0)
    return (has_no_delta, descending_delta, entry.id_alimentador)


def rank_feeders(rows: list[FeederQualityRow]) -> list[FeederRankingDTO]:
    """Ordena os alimentadores pelo maior excesso de DEC; sem limite ficam por último.

    Args:
        rows: Apurações de uma competência.

    Returns:
        Ranking por delta de DEC decrescente, com desempate por id do alimentador.
    """
    entries = [build_ranking_entry(row) for row in rows]
    return sorted(entries, key=_ranking_sort_key)


def summarize_indicators(competencia: str | None, rows: list[FeederQualityRow]) -> QualityIndicatorsDTO:
    """Consolida os indicadores da competência.

    DEC e FEC médios são a média simples do acumulado no ano até a competência; a violação
    compara o acumulado com o limite anual de cada alimentador. O DEC/FEC já divide pelas UCs
    do alimentador (denominador fixo, ADR-003), então não há ponderação adicional.

    Args:
        competencia: Competência consolidada, ou None quando não há dados.
        rows: Apurações da competência.

    Returns:
        Médias de DEC/FEC e contagem de alimentadores em violação; zerado sem apurações.
    """
    total_feeders = len(rows)
    if total_feeders == 0:
        return _empty_indicators(competencia)
    status_counts = Counter(classify_status(row) for row in rows)
    violating_feeders = status_counts[QualityStatus.VIOLACAO]
    warning_feeders = status_counts[QualityStatus.ALERTA]
    compliant_feeders = status_counts[QualityStatus.CONFORME]
    return QualityIndicatorsDTO(
        competencia=competencia,
        dec_medio_horas=_mean([row.dec_acumulado_ano_horas for row in rows]),
        fec_medio_vezes=_mean([row.fec_acumulado_ano_vezes for row in rows]),
        total_alimentadores=total_feeders,
        alimentadores_em_violacao=violating_feeders,
        percentual_violacao=violating_feeders / total_feeders * PERCENTUAL_TOTAL,
        alimentadores_em_alerta=warning_feeders,
        percentual_alerta=warning_feeders / total_feeders * PERCENTUAL_TOTAL,
        alimentadores_conformes=compliant_feeders,
        percentual_conforme=compliant_feeders / total_feeders * PERCENTUAL_TOTAL,
    )
