"""A série do backtest da Efetividade mede o mesmo modelo que a fila de produção usa."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.features.loss_management.backtest_schemas import BacktestDTO, BacktestFilterDTO
from app.features.loss_management.backtest_series import BacktestSeriesService
from app.features.loss_management.backtest_store import BacktestSeriesStore
from app.features.loss_management.daily_cache import DailyEngineCache


def empty_result(filter_dto: BacktestFilterDTO) -> BacktestDTO:
    return BacktestDTO(
        backtest_executado=True,
        cortes_disponiveis=[],
        data_corte=filter_dto.corte,
        janela_resultado_inicio=None,
        janela_resultado_fim=None,
        n_solicitado=filter_dto.tamanho,
        n_selecionadas=0,
        n_inspecionadas=0,
        n_irregulares=0,
        precisao_selecao=None,
        inspecoes_janela=0,
        linha_base=None,
        diferenca_pp=None,
        kwh_recuperado=0.0,
        por_motivo=[],
        amostra_minima_por_motivo=10,
    )


class FakeEngine:
    """Chave do cache em memória (precisa aceitar referência fraca, como o engine real)."""


def build_service(*, use_peers: bool) -> tuple[BacktestSeriesService, AsyncMock]:
    engine = FakeEngine()
    repository = SimpleNamespace(
        use_peers=use_peers,
        session=SimpleNamespace(get_bind=lambda: engine),
        fetch_field_hit_rate=AsyncMock(return_value=SimpleNamespace(first_date="2025-08-01", last_date="2025-08-31")),
    )
    backtest_run = AsyncMock(side_effect=empty_result)
    service = BacktestSeriesService(
        repository,
        SimpleNamespace(run=backtest_run),
        BacktestSeriesStore(None),
        fingerprint=AsyncMock(return_value="gold-fingerprint"),
        memory_cache=DailyEngineCache(),
        fingerprint_cache=DailyEngineCache(),
    )
    return service, backtest_run


@pytest.mark.parametrize(("use_peers", "expected_model"), [(True, "novo"), (False, "atual")])
async def test_the_series_runs_the_model_the_repository_uses(use_peers, expected_model):
    service, backtest_run = build_service(use_peers=use_peers)

    await service.run()

    assert backtest_run.await_args.args[0].modelo == expected_model


async def test_the_saved_series_is_keyed_by_the_model_so_switching_the_flag_does_not_reuse_it():
    loaded_keys: list[str] = []
    for use_peers in (True, False):
        service, _ = build_service(use_peers=use_peers)
        original_load = service.store.load
        service.store.load = lambda key, load=original_load: (loaded_keys.append(key), load(key))[1]
        await service.run()

    assert len(set(loaded_keys)) == 2
