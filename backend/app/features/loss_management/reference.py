"""Escolha da competência em que a fila de suspeitas é calculada (tempo real ou fixada num mês passado)."""

from dataclasses import dataclass
from datetime import date

from app.features.loss_management.queries import shift_competencia


@dataclass(frozen=True, slots=True)
class AnalysisReference:
    """Competência da análise e, se ela foi fixada no passado, o limite do histórico de campo."""

    competencia: str
    history_until: date | None = None  # exclusivo; None = tempo real, toda inspeção registrada vale

    @property
    def is_fixed_in_the_past(self) -> bool:
        """Indica se a fila está sendo vista como estava num mês anterior ao dos dados mais recentes."""
        return self.history_until is not None


def resolve_analysis_reference(latest_competencia: str, fixed_competencia: str | None) -> AnalysisReference:
    """Escolhe a competência da fila: a fixada na configuração, se for anterior aos dados, ou a mais recente.

    Fixar uma competência passada mostra a fila como ela estava naquele mês, então só as inspeções feitas até o
    fim dele contam como "já inspecionada"; as posteriores ainda não tinham acontecido. Uma competência fixada
    igual ou posterior à última dos dados não tem efeito.

    Args:
        latest_competencia: Competência mais recente com medição ('YYYY-MM').
        fixed_competencia: Competência fixada na configuração, ou None.

    Returns:
        A competência a usar e o limite (exclusivo) do histórico de campo.
    """
    if fixed_competencia is None or fixed_competencia >= latest_competencia:
        return AnalysisReference(competencia=latest_competencia)
    year_text, month_text = shift_competencia(fixed_competencia, 1).split("-")
    first_day_of_next_month = date(int(year_text), int(month_text), 1)
    return AnalysisReference(competencia=fixed_competencia, history_until=first_day_of_next_month)
