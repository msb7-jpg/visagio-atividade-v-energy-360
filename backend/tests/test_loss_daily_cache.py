"""Cache por dia e por banco com cálculo único: chamadas simultâneas esperam o mesmo resultado."""

import asyncio
from datetime import date, timedelta

import pytest

from app.features.loss_management import daily_cache
from app.features.loss_management.daily_cache import DailyEngineCache


class FakeEngine:
    """Chave fraca e hasheável, como o `Engine` do SQLAlchemy."""


class Counter:
    def __init__(self, result: int = 7, fails_first: bool = False) -> None:
        self.calls = 0
        self.result = result
        self.fails_first = fails_first

    async def compute(self) -> int:
        self.calls += 1
        await asyncio.sleep(0.01)  # dá a chance de as outras chamadas chegarem enquanto esta calcula
        if self.fails_first and self.calls == 1:
            raise RuntimeError("falha de leitura")
        return self.result


async def test_simultaneous_calls_compute_once_and_share_the_result():
    cache, engine, counter = DailyEngineCache[int](), FakeEngine(), Counter()

    results = await asyncio.gather(*(cache.get_or_compute(engine, "2026-06", counter.compute) for _ in range(5)))

    assert results == [7] * 5
    assert counter.calls == 1


async def test_a_later_call_reuses_the_cached_value_for_the_same_key():
    cache, engine, counter = DailyEngineCache[int](), FakeEngine(), Counter()

    await cache.get_or_compute(engine, "2026-06", counter.compute)
    await cache.get_or_compute(engine, "2026-06", counter.compute)

    assert counter.calls == 1


async def test_another_key_or_another_database_computes_again():
    cache, counter = DailyEngineCache[int](), Counter()
    first_engine, second_engine = FakeEngine(), FakeEngine()

    await cache.get_or_compute(first_engine, "2026-06", counter.compute)
    await cache.get_or_compute(first_engine, "2025-08", counter.compute)
    await cache.get_or_compute(second_engine, "2025-08", counter.compute)

    assert counter.calls == 3


async def test_the_cache_expires_at_the_end_of_the_day(monkeypatch):
    cache, engine, counter = DailyEngineCache[int](), FakeEngine(), Counter()
    first_day = date(2026, 10, 29)

    class FixedDate(date):
        current = first_day

        @classmethod
        def today(cls):
            return cls.current

    monkeypatch.setattr(daily_cache, "date", FixedDate)
    await cache.get_or_compute(engine, "2026-06", counter.compute)
    FixedDate.current = first_day + timedelta(days=1)
    await cache.get_or_compute(engine, "2026-06", counter.compute)

    assert counter.calls == 2


async def test_a_failure_is_not_cached_and_the_next_call_tries_again():
    cache, engine, counter = DailyEngineCache[int](), FakeEngine(), Counter(fails_first=True)

    with pytest.raises(RuntimeError, match="falha de leitura"):
        await cache.get_or_compute(engine, "2026-06", counter.compute)
    result = await cache.get_or_compute(engine, "2026-06", counter.compute)

    assert (result, counter.calls) == (7, 2)
