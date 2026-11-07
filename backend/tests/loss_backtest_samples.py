"""Resultados de backtest sintéticos para os testes da série de cortes e da persistência em disco."""

from datetime import date

from app.features.loss_management.backtest_schemas import BacktestDTO, BacktestSeriesDTO

DEFAULT_SIZE = 200


def sample_backtest(cutoff: str | None, size: int = DEFAULT_SIZE) -> BacktestDTO:
    """Um resultado de backtest completo para o corte pedido."""
    return BacktestDTO(
        backtest_executado=True,
        cortes_disponiveis=["2025-07", "2025-08"],
        data_corte=cutoff,
        janela_resultado_inicio=date(2025, 8, 1),
        janela_resultado_fim=date(2025, 10, 31),
        n_solicitado=size,
        n_selecionadas=size,
        n_inspecionadas=120,
        n_irregulares=113,
        precisao_selecao=113 / 120,
        inspecoes_janela=833,
        linha_base=0.649,
        diferenca_pp=29.2,
        kwh_recuperado=483_600.0,
        por_motivo=[],
        amostra_minima_por_motivo=10,
    )


def sample_series(cutoffs: list[str], size: int = DEFAULT_SIZE) -> BacktestSeriesDTO:
    """A série de resultados, um por corte."""
    return BacktestSeriesDTO(tamanho=size, cortes=[sample_backtest(cutoff, size) for cutoff in cutoffs])
