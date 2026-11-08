"""Fórmulas do backtest da fila: a seleção feita numa data de corte, medida nas inspeções dos meses seguintes.

Só usa informação disponível até o corte para escolher as UCs; as inspeções posteriores servem apenas para medir.
A linha de base é a taxa de acerto de todas as inspeções da mesma janela, isto é, o que a operação já obtinha.
"""

import calendar
from collections import Counter, defaultdict
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import date
from enum import StrEnum

from app.features.loss_management.queries import MESES_JANELA_RECENTE, competencia_first_day, shift_competencia
from app.features.loss_management.schemas import SuspicionReason, SuspiciousUnitDTO

MIN_SAMPLE_PER_REASON = 10  # inspeções mínimas de um motivo para mostrar a taxa dele; abaixo disso, amostra pequena
PERCENT = 100
HIGH_CHANCE_MIN = 0.9  # a partir daqui a UC está no patamar alto da curva de chance (92,5%)
LOW_CHANCE_MAX = 0.1  # até aqui, no patamar baixo (7,9%); entre os dois fica a rampa, sem medição (D16)


class ChanceBand(StrEnum):
    """Faixa da chance de acerto prevista: os dois patamares medidos e a rampa entre eles."""

    ALTA = "alta"
    RAMPA = "rampa"
    BAIXA = "baixa"


def chance_band(chance: float) -> ChanceBand:
    """Classifica a chance de acerto prevista de uma UC em patamar alto, rampa ou patamar baixo."""
    if chance >= HIGH_CHANCE_MIN:
        return ChanceBand.ALTA
    return ChanceBand.BAIXA if chance <= LOW_CHANCE_MAX else ChanceBand.RAMPA


@dataclass(frozen=True, slots=True)
class FieldInspection:
    """Inspeção de campo da janela de resultado."""

    id_uc: str
    inspected_on: date
    irregular: bool
    kwh_recovered: float | None


@dataclass(frozen=True, slots=True)
class ReasonOutcome:
    """Resultado das UCs selecionadas por um motivo."""

    reason: SuspicionReason
    inspected: int
    irregular: int
    sufficient_sample: bool

    @property
    def rate(self) -> float | None:
        """Taxa de acerto do motivo; None sem inspeções."""
        return self.irregular / self.inspected if self.inspected else None


@dataclass(frozen=True, slots=True)
class BandOutcome:
    """O previsto e o realizado das UCs selecionadas de uma faixa de chance."""

    band: ChanceBand
    selected: int
    inspected: int
    irregular: int
    chance_sum: float
    expected_kwh: float
    recovered_kwh: float

    @property
    def rate(self) -> float | None:
        """Acerto observado da faixa; None sem inspeções."""
        return self.irregular / self.inspected if self.inspected else None

    @property
    def mean_chance(self) -> float | None:
        """Chance de acerto média que o modelo deu às UCs inspecionadas da faixa; None sem inspeções."""
        return self.chance_sum / self.inspected if self.inspected else None


@dataclass(frozen=True, slots=True)
class PredictionOutcome:
    """O que o modelo previu para as UCs selecionadas e inspecionadas: energia, chance média e calibração por faixa.

    Vazio (zero, sem chance média e sem faixas) quando o backtest roda sem as UCs da seleção.
    """

    expected_kwh: float = 0.0
    mean_chance: float | None = None
    by_band: list[BandOutcome] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class BacktestOutcome:
    """Medidas do backtest de uma seleção."""

    selected_total: int
    selected_inspected: int
    selected_irregular: int
    window_inspections: int
    window_irregular: int
    kwh_recovered: float
    by_reason: list[ReasonOutcome]
    prediction: PredictionOutcome = field(default_factory=PredictionOutcome)
    window_irregular_units: int = 0
    queue_irregular_units: int = 0

    @property
    def precision(self) -> float | None:
        """Irregulares ÷ inspecionadas entre as selecionadas; None se nenhuma foi inspecionada."""
        return self.selected_irregular / self.selected_inspected if self.selected_inspected else None

    @property
    def baseline(self) -> float | None:
        """Taxa de acerto de todas as inspeções da janela; None se não houve inspeção."""
        return self.window_irregular / self.window_inspections if self.window_inspections else None

    @property
    def difference_pp(self) -> float | None:
        """Precisão menos linha de base, em pontos percentuais; None se algum dos dois não existe."""
        if self.precision is None or self.baseline is None:
            return None
        return (self.precision - self.baseline) * PERCENT


def outcome_window(cutoff_competencia: str) -> tuple[date, date]:
    """Janela em que o resultado é medido: os `MESES_JANELA_RECENTE` meses seguintes à competência de corte.

    Args:
        cutoff_competencia: Competência de corte ('YYYY-MM'); a fila é calculada com dados até o fim dela.

    Returns:
        Primeiro e último dia da janela de resultado.
    """
    first_competencia = shift_competencia(cutoff_competencia, 1)
    last_competencia = shift_competencia(cutoff_competencia, MESES_JANELA_RECENTE)
    last_day = date.fromisoformat(f"{last_competencia}-01")
    end = last_day.replace(day=calendar.monthrange(last_day.year, last_day.month)[1])
    return competencia_first_day(first_competencia), end


def _reason_outcomes(
    selection: Mapping[str, SuspicionReason], inspected_by_unit: Mapping[str, bool]
) -> list[ReasonOutcome]:
    inspected: dict[SuspicionReason, int] = defaultdict(int)
    irregular: dict[SuspicionReason, int] = defaultdict(int)
    for id_uc, was_irregular in inspected_by_unit.items():
        reason = selection[id_uc]
        inspected[reason] += 1
        irregular[reason] += int(was_irregular)
    return [
        ReasonOutcome(reason, inspected[reason], irregular[reason], inspected[reason] >= MIN_SAMPLE_PER_REASON)
        for reason in SuspicionReason
        if inspected[reason]
    ]


def _band_outcomes(
    units: Mapping[str, SuspiciousUnitDTO], first_by_unit: Mapping[str, FieldInspection]
) -> list[BandOutcome]:
    selected_by_band = Counter(chance_band(unit.probabilidade_acerto) for unit in units.values())
    outcomes = []
    for band in ChanceBand:
        inspected_pairs = [
            (units[id_uc], inspection)
            for id_uc, inspection in first_by_unit.items()
            if chance_band(units[id_uc].probabilidade_acerto) == band
        ]
        outcomes.append(
            BandOutcome(
                band=band,
                selected=selected_by_band[band],
                inspected=len(inspected_pairs),
                irregular=sum(inspection.irregular for _, inspection in inspected_pairs),
                chance_sum=sum(unit.probabilidade_acerto for unit, _ in inspected_pairs),
                expected_kwh=sum(
                    unit.kwh_estimado_recuperar * unit.probabilidade_acerto for unit, _ in inspected_pairs
                ),
                recovered_kwh=sum(inspection.kwh_recovered or 0.0 for _, inspection in inspected_pairs),
            )
        )
    return outcomes


def _prediction(
    units: Mapping[str, SuspiciousUnitDTO] | None, first_by_unit: Mapping[str, FieldInspection]
) -> PredictionOutcome:
    """Energia esperada, chance média prevista e a calibração por faixa; vazios sem as UCs da seleção."""
    if units is None:
        return PredictionOutcome()
    by_band = _band_outcomes(units, first_by_unit)
    chances = [units[id_uc].probabilidade_acerto for id_uc in first_by_unit]
    return PredictionOutcome(
        expected_kwh=sum(band.expected_kwh for band in by_band),
        mean_chance=sum(chances) / len(chances) if chances else None,
        by_band=by_band,
    )


def evaluate_selection(
    selection: Mapping[str, SuspicionReason],
    inspections: list[FieldInspection],
    units: Mapping[str, SuspiciousUnitDTO] | None = None,
    queue_ids: set[str] | None = None,
) -> BacktestOutcome:
    """Mede a seleção contra as inspeções feitas na janela de resultado.

    Args:
        selection: UCs selecionadas na data de corte e o motivo principal de cada uma.
        inspections: Todas as inspeções de campo da janela de resultado (selecionadas ou não).
        units: As UCs selecionadas com chance e energia previstas; habilita o esperado contra o realizado e a
            calibração por faixa. None deixa essas medidas vazias.
        queue_ids: A fila inteira no corte (não só o top N); habilita a cobertura das irregularidades do campo.

    Returns:
        Precisão, linha de base, energia recuperada e a taxa por motivo (com a marca de amostra suficiente), mais o
        esperado contra o realizado, a calibração por faixa e a cobertura da fila quando há as UCs e a fila.
    """
    selected_inspections = [inspection for inspection in inspections if inspection.id_uc in selection]
    # Se uma UC foi inspecionada mais de uma vez na janela, vale a primeira: o backtest mede a seleção, não a visita.
    first_by_unit: dict[str, FieldInspection] = {}
    for inspection in sorted(selected_inspections, key=lambda item: item.inspected_on):
        first_by_unit.setdefault(inspection.id_uc, inspection)
    irregular_by_unit = {id_uc: inspection.irregular for id_uc, inspection in first_by_unit.items()}
    irregular_units = {inspection.id_uc for inspection in inspections if inspection.irregular}
    return BacktestOutcome(
        selected_total=len(selection),
        selected_inspected=len(first_by_unit),
        selected_irregular=sum(irregular_by_unit.values()),
        window_inspections=len(inspections),
        window_irregular=sum(inspection.irregular for inspection in inspections),
        kwh_recovered=sum(inspection.kwh_recovered or 0.0 for inspection in first_by_unit.values()),
        by_reason=_reason_outcomes(selection, irregular_by_unit),
        prediction=_prediction(units, first_by_unit),
        window_irregular_units=len(irregular_units),
        queue_irregular_units=len(irregular_units & queue_ids) if queue_ids is not None else 0,
    )
