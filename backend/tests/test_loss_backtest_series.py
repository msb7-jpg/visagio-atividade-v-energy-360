"""A série do backtest calcula todos os cortes uma vez e reaproveita o resultado da memória e do disco."""

import asyncio
from types import SimpleNamespace

from app.features.loss_management.backtest_schemas import BacktestFilterDTO
from app.features.loss_management.backtest_series import BACKTEST_SIZES, BacktestSeriesService
from app.features.loss_management.backtest_store import BacktestSeriesStore
from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.queue_summary import FieldHitRate
from tests.loss_backtest_samples import DEFAULT_SIZE, sample_backtest

HIT_RATE = FieldHitRate(total=10, confirmed=5, first_date="2025-08-10", last_date="2025-09-20")
CUTOFFS = ["2025-07", "2025-08"]  # o mês anterior à primeira inspeção até o anterior à última


class FakeEngine:
    """Chave do cache em memória (precisa aceitar referência fraca, como o engine real)."""


class FakeRepository:
    def __init__(
        self, engine: FakeEngine, hit_rate: FieldHitRate | None = HIT_RATE, *, use_peers: bool = False
    ) -> None:
        self.session = SimpleNamespace(get_bind=lambda: engine)
        self.use_peers = use_peers
        self._hit_rate = hit_rate

    async def fetch_field_hit_rate(self) -> FieldHitRate | None:
        return self._hit_rate


class FakeBacktest:
    def __init__(self) -> None:
        self.calls: list[tuple[str | None, int]] = []

    async def run(self, filter_dto: BacktestFilterDTO):
        await asyncio.sleep(0)  # cede a vez, como uma consulta de verdade
        self.calls.append((filter_dto.corte, filter_dto.tamanho))
        return sample_backtest(filter_dto.corte, filter_dto.tamanho)


class Scenario:
    """Um serviço com tudo falso, exceto o disco e o cache em memória, que são os que o teste observa."""

    def __init__(self, tmp_path, *, hit_rate: FieldHitRate | None = HIT_RATE) -> None:
        self.engine = FakeEngine()
        self.fingerprint = "chave-1"
        self.fingerprint_calls = 0
        self.store = BacktestSeriesStore(tmp_path / "backtest.json")
        self.memory = DailyEngineCache()
        self.fingerprint_memory = DailyEngineCache()
        self.backtest = FakeBacktest()
        self.hit_rate = hit_rate

    async def _fingerprint(self, _session, _last_cutoff: str) -> str:
        self.fingerprint_calls += 1
        return self.fingerprint

    def service(self, *, fresh_memory: bool = False) -> BacktestSeriesService:
        """`fresh_memory` simula outro dia ou um reinício da API: as memórias vazias, o disco igual."""
        if fresh_memory:
            self.memory = DailyEngineCache()
            self.fingerprint_memory = DailyEngineCache()
        return BacktestSeriesService(
            FakeRepository(self.engine, self.hit_rate),  # type: ignore[arg-type]
            self.backtest,  # type: ignore[arg-type]
            self.store,
            fingerprint=self._fingerprint,
            memory_cache=self.memory,
            fingerprint_cache=self.fingerprint_memory,
        )


async def test_the_series_runs_every_available_cutoff_with_the_default_size(tmp_path):
    scenario = Scenario(tmp_path)

    series = await scenario.service().run()

    assert [call for call in scenario.backtest.calls if call[1] == DEFAULT_SIZE] == [
        (cutoff, DEFAULT_SIZE) for cutoff in CUTOFFS
    ]
    assert [result.data_corte for result in series.cortes] == CUTOFFS
    assert series.tamanho == DEFAULT_SIZE


async def test_the_series_measures_every_cutoff_at_every_size_one_cutoff_at_a_time(tmp_path):
    scenario = Scenario(tmp_path)

    series = await scenario.service().run()

    assert scenario.backtest.calls == [(cutoff, size) for cutoff in CUTOFFS for size in BACKTEST_SIZES]
    assert [entry.tamanho for entry in series.tamanhos] == list(BACKTEST_SIZES)
    for entry in series.tamanhos:
        assert [result.data_corte for result in entry.cortes] == CUTOFFS
        assert {result.n_solicitado for result in entry.cortes} == {entry.tamanho}


async def test_the_default_size_results_are_the_same_in_cortes_and_in_tamanhos(tmp_path):
    scenario = Scenario(tmp_path)

    series = await scenario.service().run()

    default_entry = next(entry for entry in series.tamanhos if entry.tamanho == DEFAULT_SIZE)
    assert default_entry.cortes == series.cortes


async def test_the_series_is_saved_for_the_next_start_of_the_api(tmp_path):
    scenario = Scenario(tmp_path)

    series = await scenario.service().run()

    assert scenario.store.load("chave-1|modelo=atual") == series  # a chave leva o modelo que a série mediu


async def test_a_second_request_is_answered_from_memory(tmp_path):
    scenario = Scenario(tmp_path)
    await scenario.service().run()
    calls_after_first = len(scenario.backtest.calls)

    await scenario.service().run()

    assert len(scenario.backtest.calls) == calls_after_first


async def test_after_a_restart_the_series_comes_from_disk_without_recomputing(tmp_path):
    scenario = Scenario(tmp_path)
    first = await scenario.service().run()
    calls_after_first = len(scenario.backtest.calls)

    second = await scenario.service(fresh_memory=True).run()

    assert len(scenario.backtest.calls) == calls_after_first
    assert second == first


async def test_a_new_fingerprint_recomputes_the_series(tmp_path):
    scenario = Scenario(tmp_path)
    await scenario.service().run()
    calls_after_first = len(scenario.backtest.calls)

    scenario.fingerprint = "chave-2"
    await scenario.service(fresh_memory=True).run()  # outro dia: a chave é conferida de novo

    assert len(scenario.backtest.calls) == calls_after_first + len(CUTOFFS) * len(BACKTEST_SIZES)
    assert scenario.store.load("chave-2|modelo=atual") is not None


async def test_the_fingerprint_is_computed_once_a_day_not_on_every_request(tmp_path):
    scenario = Scenario(tmp_path)

    for _ in range(3):
        await scenario.service().run()

    assert scenario.fingerprint_calls == 1


async def test_the_fingerprint_is_checked_again_after_a_restart(tmp_path):
    scenario = Scenario(tmp_path)
    await scenario.service().run()

    await scenario.service(fresh_memory=True).run()

    assert scenario.fingerprint_calls == 2


async def test_simultaneous_requests_compute_the_series_only_once(tmp_path):
    scenario = Scenario(tmp_path)

    await asyncio.gather(*(scenario.service().run() for _ in range(3)))

    assert len(scenario.backtest.calls) == len(CUTOFFS) * len(BACKTEST_SIZES)


async def test_without_field_history_the_series_is_empty_and_nothing_is_computed(tmp_path):
    scenario = Scenario(tmp_path, hit_rate=None)

    series = await scenario.service().run()

    assert series.cortes == []
    assert scenario.backtest.calls == []
    assert scenario.store.load("chave-1") is None
