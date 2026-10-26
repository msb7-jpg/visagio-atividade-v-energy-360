import pytest

from app.features.revenue.exceptions import NeighborhoodHistoryNotFoundError
from app.features.revenue.history import MonthlyTotals, build_history, competencias_until, shift_competencia
from app.features.revenue.schemas import NeighborhoodHistoryRequest
from app.features.revenue.service import RevenueService

REQUEST = NeighborhoodHistoryRequest(municipio="RECIFE", bairro="BOA VIAGEM", competencia_fim="2026-06", meses=3)


class FakeMonthlyRepository:
    """Repositório em memória que devolve totais mensais fixos."""

    def __init__(self, totals):
        self.totals = totals
        self.window = None

    async def fetch_monthly_totals(self, window, filters):
        self.window = window
        return self.totals


@pytest.mark.parametrize(
    ("competencia", "months", "expected"),
    [("2026-06", -1, "2026-05"), ("2026-01", -1, "2025-12"), ("2025-12", 1, "2026-01"), ("2026-06", 0, "2026-06")],
)
def test_shift_competencia_crosses_year_boundaries(competencia, months, expected):
    assert shift_competencia(competencia, months) == expected


def test_competencias_until_lists_consecutive_months_oldest_first():
    assert competencias_until("2026-02", 4) == ["2025-11", "2025-12", "2026-01", "2026-02"]


def test_build_history_fills_missing_months_with_zero():
    totals = [MonthlyTotals("2026-04", 1400.0, 1232.0), MonthlyTotals("2026-06", 1500.0, 1200.0)]

    history = build_history(REQUEST, totals)

    assert [point.competencia for point in history.pontos] == ["2026-04", "2026-05", "2026-06"]
    missing = history.pontos[1]
    assert missing.volume_kwh == pytest.approx(0.0)
    assert missing.receita_rs == pytest.approx(0.0)
    assert missing.tarifa_media_rs_kwh is None


def test_build_history_computes_average_tariff_per_month():
    history = build_history(REQUEST, [MonthlyTotals("2026-06", 1400.0, 1232.0)])

    assert history.pontos[-1].tarifa_media_rs_kwh == pytest.approx(0.88)


async def test_service_history_queries_the_window_ending_at_competencia_fim():
    repository = FakeMonthlyRepository([MonthlyTotals("2026-06", 1400.0, 1232.0)])
    service = RevenueService(repository)

    history = await service.get_neighborhood_history(REQUEST)

    assert (repository.window.competencia_inicio, repository.window.competencia_fim) == ("2026-04", "2026-06")
    assert history.bairro == "BOA VIAGEM"
    assert len(history.pontos) == 3


async def test_service_history_without_billing_raises_not_found():
    service = RevenueService(FakeMonthlyRepository([]))

    with pytest.raises(NeighborhoodHistoryNotFoundError):
        await service.get_neighborhood_history(REQUEST)