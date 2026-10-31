"""Regras puras da Continuidade: períodos A/B, evento extremo e agregações sobre linhas já somadas em SQL."""

from collections import defaultdict
from collections.abc import Collection, Iterable, Mapping
from dataclasses import dataclass
from statistics import median

from app.features.grid_quality.continuity_schemas import (
    CauseShareDTO,
    ContinuityEventDTO,
    ContinuityKpisDTO,
    FeederUcHoursDTO,
    MunicipalityDecDTO,
    PeriodComparisonDTO,
    TypeShareDTO,
)
from app.features.grid_quality.municipalities import MUNICIPALITY_REFERENCES

# Um mês é "evento extremo" quando suas UC-horas na rede passam de K vezes a mediana mensal da série.
LIMIAR_EVENTO_EXTREMO = 3
# Período A = primeiros N meses da série; período B = últimos N meses. Derivados dos dados, sem datas fixas.
MESES_POR_PERIODO = 12
# Alimentadores com menos UCs atendidas que isso têm DEC/FEC instáveis (poucas UCs no denominador).
LIMITE_AMOSTRA_PEQUENA_UCS = 50
# A tabela de circuitos mostra só os maiores em UC-horas; o % da rede usa o total do escopo.
LIMITE_CIRCUITOS_RANKING = 20
CAUSA_NAO_INFORMADA = "NAO INFORMADA"
SEM_CAUSA_REGISTRADA = "Sem causa registrada"
# SUPOSIÇÃO DE NEGÓCIO, a validar com a Fatia 02: causas que a manutenção preventiva consegue atacar
# (valores literais de `fato_ocorrencias_rede.causa`). As demais (CLIMATICA, TERCEIROS, NAO IDENTIFICADA e
# sem causa registrada) não contam como atacáveis.
CAUSAS_ATACAVEIS = frozenset({"VEGETACAO", "FALHA DE EQUIPAMENTO", "SOBRECARGA"})
PERCENTUAL_TOTAL = 100.0


@dataclass(frozen=True, slots=True)
class MonthlyFeederRow:
    """UC-horas e ocorrências de um alimentador em uma competência."""

    id_alimentador: str
    competencia: str
    uc_hours: float
    occurrences: int


@dataclass(frozen=True, slots=True)
class Totals:
    """UC-horas e ocorrências somadas de um conjunto de linhas."""

    uc_hours: float = 0.0
    occurrences: int = 0


def split_periods(competencias: Iterable[str]) -> tuple[list[str], list[str]]:
    """Separa a série em período A (primeiros meses) e período B (últimos meses).

    Args:
        competencias: Competências 'YYYY-MM' da série, em qualquer ordem e com repetições.

    Returns:
        Tupla (A, B) em ordem crescente; com menos meses que o dobro do período, A e B encolhem sem se sobrepor.
    """
    months = sorted(set(competencias))
    size = min(MESES_POR_PERIODO, len(months) // 2)
    return months[:size], months[len(months) - size :]


def detect_event(rows: Iterable[MonthlyFeederRow]) -> str | None:
    """Detecta o mês de evento extremo na rede inteira.

    Args:
        rows: Linhas mensais de todos os alimentadores, sem filtro de escopo.

    Returns:
        Competência do mês de maior UC-horas se passar de K vezes a mediana mensal; None se nenhum passar.
    """
    hours_by_month: dict[str, float] = defaultdict(float)
    for row in rows:
        hours_by_month[row.competencia] += row.uc_hours
    if not hours_by_month:
        return None
    threshold = LIMIAR_EVENTO_EXTREMO * median(hours_by_month.values())
    peak_month = max(hours_by_month, key=lambda month: hours_by_month[month])
    return peak_month if hours_by_month[peak_month] > threshold else None


def sum_rows(rows: Iterable[MonthlyFeederRow]) -> Totals:
    """Soma UC-horas e ocorrências das linhas."""
    row_list = list(rows)
    return Totals(sum(row.uc_hours for row in row_list), sum(row.occurrences for row in row_list))


def _ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _compare(current: float, previous: float) -> PeriodComparisonDTO:
    change_percent = (current - previous) / previous * PERCENTUAL_TOTAL if previous else 0.0
    return PeriodComparisonDTO(current=current, previous=previous, change_percent=change_percent)


def build_kpis(current: Totals, previous: Totals, scope_ucs: int) -> ContinuityKpisDTO:
    """DEC, FEC, interrupções e duração média de B contra A.

    Args:
        current: Totais do período B.
        previous: Totais do período A.
        scope_ucs: Soma das UCs atendidas dos alimentadores do escopo, contadas uma vez por alimentador.

    Returns:
        KPIs com valor de B, valor de A e variação percentual.
    """
    return ContinuityKpisDTO(
        dec=_compare(_ratio(current.uc_hours, scope_ucs), _ratio(previous.uc_hours, scope_ucs)),
        fec=_compare(_ratio(current.occurrences, scope_ucs), _ratio(previous.occurrences, scope_ucs)),
        interruptions=_compare(current.occurrences, previous.occurrences),
        average_duration_hours=_compare(
            _ratio(current.uc_hours, current.occurrences), _ratio(previous.uc_hours, previous.occurrences)
        ),
    )


def build_event(
    event_competencia: str,
    series_months: Collection[str],
    scope_rows: Collection[MonthlyFeederRow],
    period_b_without_event: Totals,
    scope_ucs: int,
) -> ContinuityEventDTO:
    """Cartão do evento: números do escopo selecionado para o mês detectado na rede inteira.

    Args:
        event_competencia: Mês do evento detectado.
        series_months: Todas as competências da série; mês sem ocorrência no escopo conta como zero.
        scope_rows: Linhas mensais dos alimentadores do escopo (e da causa, se houver), série inteira.
        period_b_without_event: Totais do período B sem o mês do evento, no escopo.
        scope_ucs: UCs atendidas do escopo (uma vez por alimentador).

    Returns:
        Ocorrências do mês, mediana mensal dos demais meses, DEC/FEC de B sem o evento e se o mês passa
        do limiar de UC-horas dentro do escopo.
    """
    occurrences_by_month: dict[str, int] = defaultdict(int)
    hours_by_month: dict[str, float] = defaultdict(float)
    for row in scope_rows:
        occurrences_by_month[row.competencia] += row.occurrences
        hours_by_month[row.competencia] += row.uc_hours
    other_months = [month for month in series_months if month != event_competencia]
    median_hours = median(hours_by_month[month] for month in other_months) if other_months else 0.0
    median_occurrences = median(occurrences_by_month[month] for month in other_months) if other_months else 0.0
    # Mediana zero (causa rara): o limiar é 0 e qualquer hora no mês passa, sem divisão.
    return ContinuityEventDTO(
        competencia=event_competencia,
        event_interruptions=occurrences_by_month[event_competencia],
        other_months_median=float(median_occurrences),
        extreme_in_scope=hours_by_month[event_competencia] > LIMIAR_EVENTO_EXTREMO * median_hours,
        dec_without_event=_ratio(period_b_without_event.uc_hours, scope_ucs),
        fec_without_event=_ratio(period_b_without_event.occurrences, scope_ucs),
    )


def _totals_by_feeder(rows: Iterable[MonthlyFeederRow]) -> dict[str, Totals]:
    grouped: dict[str, list[MonthlyFeederRow]] = defaultdict(list)
    for row in rows:
        grouped[row.id_alimentador].append(row)
    return {feeder_id: sum_rows(feeder_rows) for feeder_id, feeder_rows in grouped.items()}


def _municipality_name(municipality_key: str) -> str:
    reference = MUNICIPALITY_REFERENCES.get(municipality_key)
    return reference.name if reference else municipality_key.title()


def build_municipalities(
    current_rows: Iterable[MonthlyFeederRow],
    ucs_by_feeder: Mapping[str, int],
    municipality_by_feeder: Mapping[str, str],
) -> list[MunicipalityDecDTO]:
    """DEC de B por município do escopo, do maior para o menor; município sem referência no mapa é omitido."""
    hours_by_municipality: dict[str, float] = defaultdict(float)
    ucs_by_municipality: dict[str, int] = defaultdict(int)
    for feeder_id, totals in _totals_by_feeder(current_rows).items():
        hours_by_municipality[municipality_by_feeder[feeder_id]] += totals.uc_hours
    for feeder_id, municipality_key in municipality_by_feeder.items():
        ucs_by_municipality[municipality_key] += ucs_by_feeder.get(feeder_id, 0)
    municipalities = [
        MunicipalityDecDTO(
            name=MUNICIPALITY_REFERENCES[municipality_key].name,
            latitude=MUNICIPALITY_REFERENCES[municipality_key].latitude,
            longitude=MUNICIPALITY_REFERENCES[municipality_key].longitude,
            dec_hours=_ratio(hours_by_municipality[municipality_key], ucs_by_municipality[municipality_key]),
        )
        for municipality_key in ucs_by_municipality
        if municipality_key in MUNICIPALITY_REFERENCES
    ]
    return sorted(municipalities, key=lambda municipality: municipality.dec_hours, reverse=True)


def build_feeders(
    current_rows: Iterable[MonthlyFeederRow],
    previous_rows: Iterable[MonthlyFeederRow],
    ucs_by_feeder: Mapping[str, int],
    municipality_by_feeder: Mapping[str, str],
) -> list[FeederUcHoursDTO]:
    """Maiores alimentadores do escopo por UC-horas em B, com a comparação contra A."""
    current_by_feeder = _totals_by_feeder(current_rows)
    previous_by_feeder = _totals_by_feeder(previous_rows)
    scope_hours = sum(totals.uc_hours for totals in current_by_feeder.values())
    feeders = []
    for feeder_id, municipality_key in municipality_by_feeder.items():
        ucs = ucs_by_feeder.get(feeder_id, 0)
        current = current_by_feeder.get(feeder_id, Totals())
        feeders.append(
            FeederUcHoursDTO(
                id_alimentador=feeder_id,
                municipality=_municipality_name(municipality_key),
                ucs_served=ucs,
                dec_hours=_ratio(current.uc_hours, ucs),
                fec_times=_ratio(current.occurrences, ucs),
                interruptions=current.occurrences,
                uc_hours=current.uc_hours,
                network_share_percent=_ratio(current.uc_hours, scope_hours) * PERCENTUAL_TOTAL,
                dec_previous_hours=_ratio(previous_by_feeder.get(feeder_id, Totals()).uc_hours, ucs),
                small_sample=ucs < LIMITE_AMOSTRA_PEQUENA_UCS,
            )
        )
    feeders.sort(key=lambda feeder: feeder.uc_hours, reverse=True)
    return feeders[:LIMITE_CIRCUITOS_RANKING]


def build_cause_shares(hours_by_cause: Mapping[str, float]) -> list[CauseShareDTO]:
    """Participação de cada causa nas UC-horas; causa `NAO INFORMADA` vira 'Sem causa registrada'."""
    total_hours = sum(hours_by_cause.values())
    shares = [
        CauseShareDTO(
            cause=SEM_CAUSA_REGISTRADA if cause == CAUSA_NAO_INFORMADA else cause,
            share_percent=_ratio(cause_hours, total_hours) * PERCENTUAL_TOTAL,
            actionable=cause in CAUSAS_ATACAVEIS,
        )
        for cause, cause_hours in hours_by_cause.items()
    ]
    return sorted(shares, key=lambda share: share.share_percent, reverse=True)


def build_type_shares(count_by_type: Mapping[str, int]) -> list[TypeShareDTO]:
    """Participação de cada tipo de ocorrência na contagem de interrupções."""
    total_count = sum(count_by_type.values())
    shares = [
        TypeShareDTO(type=occurrence_type, share_percent=_ratio(type_count, total_count) * PERCENTUAL_TOTAL)
        for occurrence_type, type_count in count_by_type.items()
    ]
    return sorted(shares, key=lambda share: share.share_percent, reverse=True)
