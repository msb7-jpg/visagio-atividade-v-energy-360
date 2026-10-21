"""Regras puras de classificação, ranking e resumo de DEC/FEC por alimentador."""

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
class FeederQualityRow:
    """DEC/FEC apurado de um alimentador em uma competência, com os limites lidos do dado."""

    id_alimentador: str
    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None


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
    )


def classify_status(row: FeederQualityRow) -> QualityStatus:
    """Classifica o alimentador pelo DEC e pelo FEC apurados contra os limites informados.

    VIOLACAO se DEC ou FEC excede o limite; ALERTA se DEC ou FEC atinge 85% do limite;
    CONFORME nos demais casos. Limite nulo ou menor ou igual a zero não gera violação nem alerta.

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        Status regulatório do alimentador.
    """
    exceeds_dec = _exceeds_limit(row.dec_apurado_horas, row.dec_limite_horas)
    exceeds_fec = _exceeds_limit(row.fec_apurado_vezes, row.fec_limite_vezes)
    if exceeds_dec or exceeds_fec:
        return QualityStatus.VIOLACAO
    alert_dec = _reaches_alert(row.dec_apurado_horas, row.dec_limite_horas)
    alert_fec = _reaches_alert(row.fec_apurado_vezes, row.fec_limite_vezes)
    if alert_dec or alert_fec:
        return QualityStatus.ALERTA
    return QualityStatus.CONFORME


def delta_dec(row: FeederQualityRow) -> float | None:
    """Calcula o excesso de DEC sobre o limite (negativo quando abaixo do limite).

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        DEC apurado menos o limite, ou None quando o limite é nulo ou menor ou igual a zero.
    """
    if row.dec_limite_horas is None or row.dec_limite_horas <= 0:
        return None
    return row.dec_apurado_horas - row.dec_limite_horas


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
        dec_limite_horas=row.dec_limite_horas,
        fec_limite_vezes=row.fec_limite_vezes,
        delta_dec_horas=delta_dec(row),
        status=classify_status(row),
    )


def build_time_series_point(row: FeederQualityRow) -> FeederTimeSeriesPointDTO:
    """Converte a apuração mensal em ponto da série histórica.

    Args:
        row: Apuração do alimentador na competência.

    Returns:
        Ponto da série com DEC, FEC e limites do mês.
    """
    return FeederTimeSeriesPointDTO(
        competencia=row.competencia,
        dec_apurado_horas=row.dec_apurado_horas,
        fec_apurado_vezes=row.fec_apurado_vezes,
        dec_limite_horas=row.dec_limite_horas,
        fec_limite_vezes=row.fec_limite_vezes,
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

    A média é simples entre alimentadores; a média ponderada por UCs depende da definição
    do denominador (pergunta B2 do grupo).

    Args:
        competencia: Competência consolidada, ou None quando não há dados.
        rows: Apurações da competência.

    Returns:
        Médias de DEC/FEC e contagem de alimentadores em violação; zerado sem apurações.
    """
    total_feeders = len(rows)
    if total_feeders == 0:
        return _empty_indicators(competencia)
    violating_feeders = sum(1 for row in rows if classify_status(row) is QualityStatus.VIOLACAO)
    return QualityIndicatorsDTO(
        competencia=competencia,
        dec_medio_horas=_mean([row.dec_apurado_horas for row in rows]),
        fec_medio_vezes=_mean([row.fec_apurado_vezes for row in rows]),
        total_alimentadores=total_feeders,
        alimentadores_em_violacao=violating_feeders,
        percentual_violacao=violating_feeders / total_feeders * PERCENTUAL_TOTAL,
    )
