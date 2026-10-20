from collections.abc import Sequence
 
import pytest
 
from app.features.revenue.decomposition import SegmentTotals, decompose
from app.features.revenue.exceptions import InvalidPeriodError, RevenueDataNotFoundError
from app.features.revenue.schemas import PeriodWindow, RevenueFilters
from app.features.revenue.service import RevenueService
 
BASE_WINDOW = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT_WINDOW = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")
NO_FILTERS = RevenueFilters()
 
 
def segment(base: tuple[float, float], current: tuple[float, float], bairro: str = "BOA VIAGEM") -> SegmentTotals:
    """Segmento de teste; cada par é (volume em kWh, receita em R$)."""
    return SegmentTotals(
        classe_consumo="Residencial",
        municipio="RECIFE",
        bairro=bairro,
        volume_base_kwh=base[0],
        receita_base_rs=base[1],
        volume_atual_kwh=current[0],
        receita_atual_rs=current[1],
    )
 
 
class FakeSegmentRepository:
    """Repositório falso: devolve segmentos prontos e registra como foi chamado."""
 
    def __init__(self, segments: Sequence[SegmentTotals]) -> None:
        self.segments = segments
        self.calls: list[tuple[PeriodWindow, PeriodWindow, RevenueFilters]] = []
 
    async def fetch_segment_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> Sequence[SegmentTotals]:
        self.calls.append((base, current, filters))
        return self.segments
 
 
def test_golden_example_separates_price_volume_and_cross_effects():
    # 1000 kWh a R$ 0,80 viram 900 kWh a R$ 0,88: a receita vai de 800 para 792.
    result = decompose([segment(base=(1000.0, 800.0), current=(900.0, 792.0))])
 
    assert result.receita_base_rs == pytest.approx(800.0)
    assert result.receita_atual_rs == pytest.approx(792.0)
    assert result.variacao_rs == pytest.approx(-8.0)
    assert result.variacao_pct == pytest.approx(-1.0)
    assert result.efeito_preco_rs == pytest.approx(80.0)
    assert result.efeito_volume_rs == pytest.approx(-80.0)
    assert result.efeito_cruzado_rs == pytest.approx(-8.0)
    assert result.efeito_mix_rs == pytest.approx(0.0)
 
 
def test_mix_explains_revenue_drop_when_total_volume_and_prices_are_flat():
    # O volume total e as tarifas não mudam, mas 200 kWh migram do segmento caro para o barato.
    expensive_segment = segment(base=(1000.0, 1000.0), current=(800.0, 800.0), bairro="BOA VIAGEM")
    cheap_segment = segment(base=(1000.0, 500.0), current=(1200.0, 600.0), bairro="VARADOURO")
 
    result = decompose([expensive_segment, cheap_segment])
 
    assert result.variacao_rs == pytest.approx(-100.0)
    assert result.efeito_preco_rs == pytest.approx(0.0)
    assert result.efeito_volume_rs == pytest.approx(0.0)
    assert result.efeito_mix_rs == pytest.approx(-100.0)
    assert result.efeito_cruzado_rs == pytest.approx(0.0)
 
 
@pytest.mark.parametrize(
    ("scenario", "segments"),
    [
        ("sem mudança", [segment((1000.0, 800.0), (1000.0, 800.0))]),
        ("só preço", [segment((500.0, 400.0), (500.0, 440.0))]),
        ("só volume", [segment((2000.0, 1400.0), (1500.0, 1050.0))]),
        ("preço sobe e volume cai", [segment((1000.0, 800.0), (900.0, 792.0))]),
        ("segmento novo", [segment((1000.0, 800.0), (900.0, 792.0)), segment((0.0, 0.0), (300.0, 270.0), "NOVO")]),
        (
            "segmento perdido",
            [segment((1000.0, 800.0), (900.0, 792.0)), segment((400.0, 320.0), (0.0, 0.0), "PERDIDO")],
        ),
        (
            "dois segmentos com mix",
            [segment((1000.0, 1000.0), (800.0, 880.0)), segment((1000.0, 500.0), (1200.0, 660.0), "OUTRO")],
        ),
    ],
)
def test_effects_always_add_up_to_the_revenue_change(scenario, segments):
    result = decompose(segments)
 
    effects_total = result.efeito_preco_rs + result.efeito_volume_rs + result.efeito_mix_rs + result.efeito_cruzado_rs
    expected_change = result.receita_atual_rs - result.receita_base_rs
    assert result.variacao_rs == pytest.approx(expected_change, abs=0.01), scenario
    assert effects_total == pytest.approx(expected_change, abs=0.05), scenario
 
 
def test_new_segment_has_all_its_revenue_attributed_to_volume():
    new_segment = segment(base=(0.0, 0.0), current=(300.0, 270.0), bairro="NOVO")
 
    result = decompose([new_segment])
 
    assert result.segmentos[0].efeito_volume_rs == pytest.approx(270.0)
    assert result.segmentos[0].efeito_preco_rs == pytest.approx(0.0)
    assert result.efeito_mix_rs == pytest.approx(0.0)
 
 
def test_variation_pct_is_none_when_base_revenue_is_zero():
    result = decompose([segment(base=(0.0, 0.0), current=(300.0, 270.0))])
 
    assert result.variacao_pct is None
 
 
async def test_service_returns_decomposition_and_forwards_windows_and_filters():
    repository = FakeSegmentRepository([segment(base=(1000.0, 800.0), current=(900.0, 792.0))])
    filters = RevenueFilters(municipio="RECIFE")
 
    result = await RevenueService(repository).get_decomposition(BASE_WINDOW, CURRENT_WINDOW, filters)
 
    assert result.efeito_preco_rs == pytest.approx(80.0)
    assert repository.calls == [(BASE_WINDOW, CURRENT_WINDOW, filters)]
 
 
async def test_service_raises_not_found_when_repository_has_no_segments():
    service = RevenueService(FakeSegmentRepository([]))
 
    with pytest.raises(RevenueDataNotFoundError):
        await service.get_decomposition(BASE_WINDOW, CURRENT_WINDOW, NO_FILTERS)
 
 
@pytest.mark.parametrize(
    "overlapping_current",
    [
        PeriodWindow(competencia_inicio="2023-06", competencia_fim="2024-05"),
        PeriodWindow(competencia_inicio="2022-01", competencia_fim="2022-12"),
    ],
)
async def test_service_rejects_windows_that_overlap_or_are_out_of_order(overlapping_current):
    repository = FakeSegmentRepository([segment(base=(1000.0, 800.0), current=(900.0, 792.0))])
 
    with pytest.raises(InvalidPeriodError):
        await RevenueService(repository).get_decomposition(BASE_WINDOW, overlapping_current, NO_FILTERS)
 
    assert repository.calls == []
 
 
def test_period_window_rejects_start_after_end_and_bad_format():
    with pytest.raises(ValueError, match="competencia_inicio"):
        PeriodWindow(competencia_inicio="2026-06", competencia_fim="2025-07")
    with pytest.raises(ValueError, match="competencia_inicio"):
        PeriodWindow(competencia_inicio="2026-13", competencia_fim="2026-14")