import pytest

from app.features.executive_dashboard.indicators import AreaTotals
from app.features.executive_dashboard.service import ExecutiveDashboardService
from app.features.loss_management.queue_summary import FieldHitRate
from app.features.loss_management.scoring import LIMIAR_QUEDA_MODERADA, ConsumptionProfile, QueueCandidates
from app.features.revenue.exceptions import InvalidPeriodError, RevenueDataNotFoundError
from app.features.revenue.kpis import PeriodTotals, WindowTotals
from app.features.revenue.schemas import PeriodWindow
from tests.loss_tariff import TEST_TARIFF

BASE_WINDOW = PeriodWindow(competencia_inicio="2022-07", competencia_fim="2023-06")
CURRENT_WINDOW = PeriodWindow(competencia_inicio="2025-07", competencia_fim="2026-06")
AREAS = AreaTotals(1000.0, 50.0, 10, 20.0, 4.0, 12.0, 100, 10, 0)


class FakeDashboardRepository:
    def __init__(self) -> None:
        self.area_calls = 0

    async def fetch_area_totals(self, base, current):
        self.area_calls += 1
        return AREAS, AREAS

    async def fetch_available_period(self):
        return PeriodWindow(competencia_inicio="2022-07", competencia_fim="2026-06")

    async def fetch_latest_measurement(self):
        return "2026-06"


class FakeRevenueRepository:
    def __init__(self, invoices: int = 12) -> None:
        self.invoices = invoices
        self.calls = 0

    async def fetch_period_totals(self, base, current, filters):
        self.calls += 1
        totals = WindowTotals(1000.0, 1250.0, self.invoices, 10)
        return PeriodTotals(base=totals, current=totals)


class FakeLossRepository:
    def __init__(self, reference_competencia: str | None = None) -> None:
        self.reference_competencia = reference_competencia
        self.received_filters = []
        self.extra_profiles: list[ConsumptionProfile] = []
        self.portfolio_ratio = 1.0

    async def fetch_consumption_profiles(self, filters):
        self.received_filters.append(filters)
        drop = ConsumptionProfile("UC1", "RECIFE", "CENTRO", "Residencial", 300.0, 50.0, 0)
        steady = ConsumptionProfile("UC2", "RECIFE", "CENTRO", "Residencial", 200.0, 200.0, 0)
        return QueueCandidates(
            profiles=[drop, steady, *self.extra_profiles],
            field_history_applied=True,
            reference_competencia=self.reference_competencia,
            portfolio_ratio=self.portfolio_ratio,
        )

    async def fetch_average_tariff(self):
        return TEST_TARIFF

    async def fetch_field_hit_rate(self):
        return FieldHitRate(total=8, confirmed=2, first_date="2025-08-01", last_date="2025-12-20")


def build_service(*, invoices: int = 12, reference_competencia: str | None = None):
    repository = FakeDashboardRepository()
    service = ExecutiveDashboardService(
        repository=repository,
        revenue_repository=FakeRevenueRepository(invoices),
        loss_repository=FakeLossRepository(reference_competencia),
    )
    return service, repository


async def test_indicators_are_cached_per_window_pair():
    service, repository = build_service()
    other_current = PeriodWindow(competencia_inicio="2025-08", competencia_fim="2026-06")

    first = await service.get_indicators(BASE_WINDOW, CURRENT_WINDOW)
    second = await service.get_indicators(BASE_WINDOW, CURRENT_WINDOW)
    await service.get_indicators(BASE_WINDOW, other_current)

    assert first is second
    assert repository.area_calls == 2
    assert service.revenue_repository.calls == 2


async def test_rejects_overlapping_windows_before_reading_areas():
    service, repository = build_service()
    overlapping = PeriodWindow(competencia_inicio="2023-01", competencia_fim="2023-12")

    with pytest.raises(InvalidPeriodError):
        await service.get_indicators(BASE_WINDOW, overlapping)
    assert repository.area_calls == 0


async def test_raises_not_found_without_billing():
    service, repository = build_service(invoices=0)

    with pytest.raises(RevenueDataNotFoundError):
        await service.get_indicators(BASE_WINDOW, CURRENT_WINDOW)
    assert repository.area_calls == 0


async def test_indicators_keep_windows_and_available_period():
    service, _ = build_service()

    dashboard = await service.get_indicators(BASE_WINDOW, CURRENT_WINDOW)

    assert dashboard.base == BASE_WINDOW
    assert dashboard.atual == CURRENT_WINDOW
    assert dashboard.periodo_disponivel.competencia_fim == "2026-06"
    overdue = dashboard.grupos[1].indicadores[0]
    assert (overdue.id, overdue.base, overdue.variacao_pp, overdue.avaliacao) == ("inadimplencia", 5.0, 0.0, "ESTAVEL")


async def test_losses_snapshot_counts_ranked_units_and_hit_rate():
    service, _ = build_service()

    snapshot = await service.get_losses_snapshot()

    assert snapshot.competencia_referencia == "2026-06"
    assert snapshot.competencia_fixada is False
    assert (snapshot.ucs_na_fila, snapshot.ucs_prioritarias) == (1, 1)
    assert snapshot.energia_prioritaria_kwh_mes == pytest.approx(250.0)
    assert snapshot.taxa_acerto_pct == pytest.approx(25.0)
    assert snapshot.inspecoes_avaliadas == 8


async def test_losses_snapshot_counts_value_only_for_priority_units_weighted_by_hit_chance():
    service, _ = build_service()
    service.loss_repository.portfolio_ratio = 0.7
    low_chance = ConsumptionProfile("UC3", "RECIFE", "CENTRO", "Residencial", 300.0, 210.0, 0)
    service.loss_repository.extra_profiles = [low_chance]

    snapshot = await service.get_losses_snapshot()

    assert (snapshot.ucs_na_fila, snapshot.ucs_prioritarias) == (2, 1)
    assert snapshot.valor_prioritario_rs_ano == pytest.approx(2250.0)
    assert snapshot.retorno_esperado_rs_ano == pytest.approx(2250.0 * 0.93)


async def test_losses_snapshot_prefers_fixed_reference_competencia():
    service, _ = build_service(reference_competencia="2025-12")

    snapshot = await service.get_losses_snapshot()

    assert snapshot.competencia_referencia == "2025-12"
    assert snapshot.competencia_fixada is True


async def test_losses_snapshot_uses_the_same_drop_threshold_as_the_loss_queue():
    service, _ = build_service()

    await service.get_losses_snapshot()

    assert [filters.limiar_queda for filters in service.loss_repository.received_filters] == [LIMIAR_QUEDA_MODERADA]

