"""O resultado do backtest fica em disco e só vale enquanto a chave dos dados e do código não muda."""

import json
import logging

from app.features.loss_management.backtest_store import BacktestSeriesStore
from tests.loss_backtest_samples import sample_series

CUTOFFS = ["2025-07", "2025-08"]


def test_a_saved_series_is_loaded_back_with_the_same_fingerprint(tmp_path):
    store = BacktestSeriesStore(tmp_path / "backtest.json")
    store.save("chave-1", sample_series(CUTOFFS))

    assert store.load("chave-1") == sample_series(CUTOFFS)


def test_a_series_saved_under_another_fingerprint_is_not_returned(tmp_path):
    store = BacktestSeriesStore(tmp_path / "backtest.json")
    store.save("chave-1", sample_series(CUTOFFS))

    assert store.load("chave-2") is None


def test_saving_again_replaces_the_previous_series(tmp_path):
    store = BacktestSeriesStore(tmp_path / "backtest.json")
    store.save("chave-1", sample_series(CUTOFFS))
    store.save("chave-2", sample_series(["2025-09"]))

    assert store.load("chave-1") is None
    assert store.load("chave-2") == sample_series(["2025-09"])


def test_loading_without_a_file_returns_nothing(tmp_path):
    assert BacktestSeriesStore(tmp_path / "ausente.json").load("chave-1") is None


def test_a_corrupt_file_is_ignored_and_reported(tmp_path, caplog):
    path = tmp_path / "backtest.json"
    path.write_text("{ isto nao e json", encoding="utf-8")

    with caplog.at_level(logging.WARNING):
        loaded = BacktestSeriesStore(path).load("chave-1")

    assert loaded is None
    assert "backtest" in caplog.text.lower()


def test_a_file_outside_the_contract_is_ignored_and_reported(tmp_path, caplog):
    path = tmp_path / "backtest.json"
    path.write_text(json.dumps({"fingerprint": "chave-1", "series": {"tamanho": "muito"}}), encoding="utf-8")

    with caplog.at_level(logging.WARNING):
        loaded = BacktestSeriesStore(path).load("chave-1")

    assert loaded is None
    assert "backtest" in caplog.text.lower()


def test_without_a_path_the_store_is_disabled(tmp_path):
    store = BacktestSeriesStore(None)

    store.save("chave-1", sample_series(CUTOFFS))

    assert store.load("chave-1") is None
    assert list(tmp_path.iterdir()) == []


def test_saving_creates_the_missing_folders(tmp_path):
    store = BacktestSeriesStore(tmp_path / "cache" / "fundo" / "backtest.json")

    store.save("chave-1", sample_series(CUTOFFS))

    assert store.load("chave-1") == sample_series(CUTOFFS)


def test_a_write_failure_is_reported_and_never_breaks_the_request(tmp_path, caplog):
    blocking_file = tmp_path / "ocupado"
    blocking_file.write_text("x", encoding="utf-8")
    store = BacktestSeriesStore(blocking_file / "backtest.json")  # a "pasta" é um arquivo

    with caplog.at_level(logging.WARNING):
        store.save("chave-1", sample_series(CUTOFFS))

    assert store.load("chave-1") is None
    assert "backtest" in caplog.text.lower()
