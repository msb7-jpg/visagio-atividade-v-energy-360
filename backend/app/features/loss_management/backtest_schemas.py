"""Schemas do backtest da fila (tela Efetividade)."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.features.loss_management.backtest_formulas import ChanceBand
from app.features.loss_management.schemas import FILA_CAPACIDADE_MENSAL, SuspicionReason

COMPETENCIA_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


class BacktestFilterDTO(BaseModel):
    """Data de corte e tamanho da seleção do backtest (query params)."""

    corte: str | None = Field(
        default=None,
        pattern=COMPETENCIA_PATTERN,
        description="Competência de corte 'YYYY-MM'; vazio usa a anterior à primeira inspeção do histórico",
    )
    tamanho: int = Field(default=FILA_CAPACIDADE_MENSAL, ge=1, le=500, description="Tamanho da seleção (top N da fila)")
    modelo: Literal["atual", "novo"] = Field(
        default="atual",
        description="Temporário (D16): 'novo' compara cada UC com os pares da classe; 'atual' usa a carteira inteira",
    )


class ReasonBacktestDTO(BaseModel):
    """Taxa de acerto das UCs selecionadas por um motivo."""

    motivo: SuspicionReason
    inspecionadas: int
    irregulares: int
    taxa: float | None = Field(description="Irregulares ÷ inspecionadas; vazio sem inspeções")
    amostra_suficiente: bool = Field(description="Falso com menos inspeções que o mínimo definido para mostrar a taxa")


class BandBacktestDTO(BaseModel):
    """O previsto e o realizado das UCs selecionadas de uma faixa de chance de acerto."""

    faixa: ChanceBand = Field(description="Patamar alto (chance de 90% ou mais), rampa ou patamar baixo (10% ou menos)")
    selecionadas: int
    inspecionadas: int
    irregulares: int
    taxa: float | None = Field(description="Acerto observado: irregulares ÷ inspecionadas; vazio sem inspeções")
    chance_prevista: float | None = Field(description="Chance de acerto média que o modelo deu às inspecionadas")
    kwh_esperado: float = Field(description="Energia a recuperar vezes a chance de acerto, somada nas inspecionadas")
    kwh_recuperado: float = Field(description="Energia efetivamente recuperada nas inspecionadas")


class BacktestDTO(BaseModel):
    """Resultado do backtest: a fila como estava no corte, medida nas inspeções dos meses seguintes."""

    backtest_executado: bool = Field(description="Falso quando não há histórico de inspeções para medir")
    cortes_disponiveis: list[str] = Field(description="Competências de corte com ao menos um mês de resultado")
    data_corte: str | None
    janela_resultado_inicio: date | None
    janela_resultado_fim: date | None
    n_solicitado: int
    n_selecionadas: int
    n_inspecionadas: int = Field(description="Selecionadas que foram inspecionadas na janela de resultado")
    n_irregulares: int
    precisao_selecao: float | None = Field(description="Irregulares ÷ inspecionadas entre as selecionadas")
    inspecoes_janela: int = Field(description="Todas as inspeções da janela, selecionadas ou não")
    linha_base: float | None = Field(description="Taxa de acerto de todas as inspeções da janela")
    diferenca_pp: float | None = Field(description="Precisão menos linha de base, em pontos percentuais")
    kwh_recuperado: float = Field(description="Energia recuperada nas inspeções das selecionadas")
    por_motivo: list[ReasonBacktestDTO]
    amostra_minima_por_motivo: int
    kwh_esperado: float = Field(
        default=0.0, description="Energia que o modelo esperava recuperar nas UCs selecionadas que foram inspecionadas"
    )
    chance_media_prevista: float | None = Field(
        default=None, description="Chance de acerto média das selecionadas inspecionadas; compare com a precisão"
    )
    irregulares_janela: int = Field(
        default=0, description="UCs com irregularidade confirmada pelo campo na janela, na fila ou fora dela"
    )
    irregulares_na_fila: int = Field(
        default=0, description="Dessas, as que a fila inteira do corte continha (não só o top N)"
    )
    por_faixa: list[BandBacktestDTO] = Field(default_factory=list, description="Previsto contra realizado por faixa")


class BacktestSizeDTO(BaseModel):
    """O backtest de todos os cortes disponíveis para um tamanho de seleção."""

    tamanho: int = Field(description="Tamanho da seleção (top N da fila) usado em todos os cortes")
    cortes: list[BacktestDTO] = Field(description="Um resultado por corte, do mais antigo ao mais recente")


class BacktestSeriesDTO(BaseModel):
    """O backtest de todos os cortes disponíveis, no tamanho padrão e em outros tamanhos de seleção."""

    tamanho: int = Field(description="Tamanho padrão da seleção (top N da fila), o de `cortes`")
    cortes: list[BacktestDTO] = Field(
        description="Um resultado por corte no tamanho padrão, do mais antigo ao mais recente; vazio sem histórico"
    )
    tamanhos: list[BacktestSizeDTO] = Field(
        default_factory=list,
        description="Todos os tamanhos medidos, incluindo o padrão: mostra como a cobertura e a precisão mudam com N",
    )
