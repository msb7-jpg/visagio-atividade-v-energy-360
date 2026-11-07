"""O pré-cálculo da subida é só uma otimização: nunca derruba a API e deixa a fila de hoje por último."""

from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.features.loss_management import warmup
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.service import LossService
from app.features.loss_management.warmup import warm_up_backtest_series, warm_up_loss_queue


@pytest.fixture
async def session_factory_without_gold_tables():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(InspectionOrder.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest.fixture
def logged_exceptions(monkeypatch) -> Mock:
    """Observa o registro do erro no logger do módulo, que não depende da configuração global de logging."""
    exception_logger = Mock()
    monkeypatch.setattr(warmup.logger, "exception", exception_logger)
    return exception_logger


async def test_the_warm_ups_survive_missing_gold_tables(session_factory_without_gold_tables):
    await warm_up_loss_queue(session_factory_without_gold_tables, get_settings())
    await warm_up_backtest_series(session_factory_without_gold_tables, get_settings())


async def test_an_unexpected_error_in_the_queue_warm_up_is_logged_and_never_escapes(
    session_factory_without_gold_tables, monkeypatch, logged_exceptions
):
    monkeypatch.setattr(LossService, "list_suspicious_units", AsyncMock(side_effect=RuntimeError("falha inesperada")))

    await warm_up_loss_queue(session_factory_without_gold_tables, get_settings())

    logged_exceptions.assert_called_once()


async def test_an_unexpected_error_in_the_backtest_warm_up_is_logged_and_never_escapes(
    session_factory_without_gold_tables, monkeypatch, logged_exceptions
):
    monkeypatch.setattr(warmup, "build_backtest_series_service", Mock(side_effect=RuntimeError("falha no backtest")))

    await warm_up_backtest_series(session_factory_without_gold_tables, get_settings())

    logged_exceptions.assert_called_once()


async def test_the_backtest_is_warmed_before_the_queue_so_the_queue_of_today_is_the_last_in_the_caches(monkeypatch):
    order: list[str] = []
    monkeypatch.setattr(
        warmup, "warm_up_backtest_series", AsyncMock(side_effect=lambda *_arguments: order.append("backtest"))
    )
    monkeypatch.setattr(warmup, "warm_up_loss_queue", AsyncMock(side_effect=lambda *_arguments: order.append("fila")))

    await warmup.warm_up_loss_screens(None, get_settings())  # type: ignore[arg-type]

    assert order == ["backtest", "fila"]
