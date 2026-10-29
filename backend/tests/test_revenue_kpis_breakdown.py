import pytest

from app.features.revenue.breakdown import build_breakdown, group_key, sort_rows
from app.features.revenue.decomposition import SegmentTotals
from app.features.revenue.exceptions import RevenueDataNotFoundError
from app.features.revenue.kpis import PeriodTotals, WindowTotals, build_kpis, kpi_value, safe_ratio
from app.features.revenue.schemas import (
    BreakdownLevel,
    BreakdownQuery,
    BreakdownSortField,
    PeriodWindow,
    RevenueFilters,
    SortOrder,
)
from app.features.revenue.service import RevenueService

BASE = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")
NO_FILTERS = RevenueFilters()

SEGMENTS = (
    SegmentTotals("Residencial", "RECIFE", "BOA VIAGEM", 18000.0, 14400.0, 16800.0, 14784.0),
    SegmentTotals("Comercial", "RECIFE", "CASA AMARELA", 24000.0, 16800.0, 18000.0, 12600.0),
    SegmentTotals("Industrial", "JABOATAO", "PIEDADE", 60000.0, 30000.0, 60000.0, 30000.0),
    SegmentTotals("Residencial", "OLINDA", "VARADOURO", 4800.0, 3840.0, 5760.0, 5068.8),
)


class FakeRevenueRepository:
    """Repositório em memória: devolve segmentos e totais fixos, sem banco."""

    def __init__(self, segments=SEGMENTS, totals=None):
        self.segments = segments
        self.totals = totals

    async def fetch_segment_totals(self, base, current, filters):
        return list(self.segments)

    async def fetch_period_totals(self, base, current, filters):
        return self.totals


def window_totals(receita: float, volume: float, faturas: int = 60, ucs: int = 5) -> WindowTotals:
    return WindowTotals(receita_rs=receita, volume_kwh=volume, faturas=faturas, ucs_ativas=ucs)


@pytest.mark.parametrize(
    ("numerator", "denominator", "expected"),
    [(10.0, 4.0, 2.5), (10.0, 0.0, None), (10.0, -1.0, None)],
)
def test_safe_ratio(numerator, denominator, expected):
    assert safe_ratio(numerator, denominator) == expected


def test_kpi_value_computes_percentage_change():
    result = kpi_value(65040.0, 62452.8)

    assert result.base == pytest.approx(65040.0)
    assert result.atual == pytest.approx(62452.8)
    assert result.variacao_pct == pytest.approx(-4.0)


@pytest.mark.parametrize(("base", "current"), [(0.0, 10.0), (None, 10.0), (10.0, None)])
def test_kpi_value_without_comparable_base_has_no_percentage(base, current):
    assert kpi_value(base, current).variacao_pct is None


def test_build_kpis_from_period_totals():
    totals = PeriodTotals(base=window_totals(65040.0, 106800.0), current=window_totals(62452.8, 100560.0))

    kpis = build_kpis(totals)

    assert kpis.faturamento_rs.variacao_pct == pytest.approx(-4.0)
    assert kpis.volume_kwh.variacao_pct == pytest.approx(-5.8)
    assert kpis.tarifa_media_rs_kwh.base == pytest.approx(0.609, abs=1e-4)
    assert kpis.tarifa_media_rs_kwh.atual == pytest.approx(0.6211, abs=1e-4)
    assert kpis.ticket_medio_rs.base == pytest.approx(1084.0)
    assert kpis.ticket_medio_rs.atual == pytest.approx(1040.88)
    assert kpis.ucs_ativas.base == 5
    assert kpis.ucs_ativas.variacao_pct == pytest.approx(0.0)


def test_build_kpis_with_empty_window_has_no_average_values():
    totals = PeriodTotals(base=window_totals(0.0, 0.0, faturas=0, ucs=0), current=window_totals(100.0, 50.0))

    kpis = build_kpis(totals)

    assert kpis.tarifa_media_rs_kwh.base is None
    assert kpis.ticket_medio_rs.variacao_pct is None


@pytest.mark.parametrize(
    ("level", "expected_key"),
    [
        (BreakdownLevel.BAIRRO, ("RECIFE", "BOA VIAGEM", None)),
        (BreakdownLevel.MUNICIPIO, ("RECIFE", None, None)),
        (BreakdownLevel.CLASSE_CONSUMO, (None, None, "Residencial")),
    ],
)
def test_group_key_by_level(level, expected_key):
    assert group_key(SEGMENTS[0], level) == expected_key


def test_breakdown_by_neighborhood_has_one_row_per_neighborhood():
    rows = build_breakdown(SEGMENTS, BreakdownLevel.BAIRRO)

    assert sorted(row.bairro for row in rows) == ["BOA VIAGEM", "CASA AMARELA", "PIEDADE", "VARADOURO"]


def test_breakdown_by_city_sums_neighborhoods_of_the_same_city():
    rows = build_breakdown(SEGMENTS, BreakdownLevel.MUNICIPIO)

    recife = next(row for row in rows if row.municipio == "RECIFE")
    assert len(rows) == 3
    assert recife.efeito_volume_rs == pytest.approx(-5160.0)
    assert recife.variacao_rs == pytest.approx(14784.0 + 12600.0 - 14400.0 - 16800.0)


@pytest.mark.parametrize("level", list(BreakdownLevel))
def test_breakdown_rows_sum_to_total_revenue_change(level):
    rows = build_breakdown(SEGMENTS, level)

    total_change = sum(segment.receita_atual_rs - segment.receita_base_rs for segment in SEGMENTS)
    assert sum(row.variacao_rs for row in rows) == pytest.approx(total_change, abs=0.05)
    for row in rows:
        effects = row.efeito_preco_rs + row.efeito_volume_rs + row.efeito_cruzado_rs
        assert effects == pytest.approx(row.variacao_rs, abs=0.05)


def test_sort_puts_largest_volume_loss_first_by_default_order():
    rows = build_breakdown(SEGMENTS, BreakdownLevel.BAIRRO)

    ranked = sort_rows(rows, BreakdownSortField.EFEITO_VOLUME, SortOrder.ASC)

    assert [row.bairro for row in ranked] == ["CASA AMARELA", "BOA VIAGEM", "PIEDADE", "VARADOURO"]


def test_sort_descending_reverses_the_ranking():
    rows = build_breakdown(SEGMENTS, BreakdownLevel.BAIRRO)

    ranked = sort_rows(rows, BreakdownSortField.EFEITO_VOLUME, SortOrder.DESC)

    assert ranked[0].bairro == "VARADOURO"


async def test_service_paginates_breakdown():
    service = RevenueService(FakeRevenueRepository())
    query = BreakdownQuery(page=2, page_size=3)

    page = await service.get_breakdown(BASE, CURRENT, NO_FILTERS, query)

    assert page.total == 4
    assert page.total_pages == 2
    assert [row.bairro for row in page.items] == ["VARADOURO"]


async def test_service_breakdown_without_segments_raises_not_found():
    service = RevenueService(FakeRevenueRepository(segments=()))

    with pytest.raises(RevenueDataNotFoundError):
        await service.get_breakdown(BASE, CURRENT, NO_FILTERS, BreakdownQuery())
