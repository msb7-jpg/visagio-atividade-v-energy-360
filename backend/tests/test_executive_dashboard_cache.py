from app.features.executive_dashboard.cache import ResultCache


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_cache_returns_value_until_it_expires():
    clock = FakeClock()
    cache: ResultCache[str, int] = ResultCache(ttl_seconds=60, clock=clock)

    cache.put("painel", 1)
    clock.now = 59.9
    assert cache.get("painel") == 1
    clock.now = 60.0
    assert cache.get("painel") is None


def test_cache_clear_drops_everything():
    cache: ResultCache[str, int] = ResultCache(ttl_seconds=60)
    cache.put("painel", 1)

    cache.clear()

    assert cache.get("painel") is None
