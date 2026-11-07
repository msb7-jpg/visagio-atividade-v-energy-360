"""Schemas do backtest da fila (tela Efetividade)."""

from datetime import date

from pydantic import BaseModel, Field

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


class ReasonBacktestDTO(BaseModel):
    """Taxa de acerto das UCs selecionadas por um motivo."""

    motivo: SuspicionReason
    inspecionadas: int
    irregulares: int
    taxa: float | None = Field(description="Irregulares ÷ inspecionadas; vazio sem inspeções")
    amostra_suficiente: bool = Field(description="Falso com menos inspeções que o mínimo definido para mostrar a taxa")


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


class BacktestSeriesDTO(BaseModel):
    """O backtest de todos os cortes disponíveis, com o mesmo tamanho de seleção."""

    tamanho: int = Field(description="Tamanho da seleção (top N da fila) usado em todos os cortes")
    cortes: list[BacktestDTO] = Field(
        description="Um resultado por corte, do mais antigo ao mais recente; vazio sem histórico de inspeções"
    )
