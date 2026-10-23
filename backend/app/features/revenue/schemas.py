from enum import StrEnum
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.shared.pagination import PaginationParams

COMPETENCIA_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"
Competencia = Annotated[str, Field(pattern=COMPETENCIA_PATTERN, examples=["2026-06"])]


class PeriodWindow(BaseModel):
    """Janela de competências consecutivas (formato 'YYYY-MM') usada como base ou como período atual."""

    model_config = ConfigDict(frozen=True)

    competencia_inicio: Competencia
    competencia_fim: Competencia

    @model_validator(mode="after")
    def check_start_before_end(self) -> Self:
        """Garante que a janela não termina antes de começar."""
        if self.competencia_inicio > self.competencia_fim:
            raise ValueError("competencia_inicio não pode ser posterior a competencia_fim")
        return self


class RevenueFilters(BaseModel):
    """Recortes opcionais aplicados à decomposição da receita."""

    model_config = ConfigDict(frozen=True)

    municipio: str | None = None
    bairro: str | None = None
    classe_consumo: str | None = None


class SegmentDecompositionDTO(BaseModel):
    """Decomposição preço-volume da variação de receita de um segmento (classe x município x bairro)."""

    classe_consumo: str | None = None
    municipio: str | None = None
    bairro: str | None = None
    receita_base_rs: float
    receita_atual_rs: float
    variacao_rs: float
    efeito_preco_rs: float
    efeito_volume_rs: float
    efeito_cruzado_rs: float


class PriceVolumeDecompositionDTO(BaseModel):
    """Decomposição Preço-Volume-Mix da variação de receita entre a janela base e a janela atual.

    A soma de preço, volume, mix e cruzado é igual à variação total de receita (identidade da decomposição).
    """

    receita_base_rs: float
    receita_atual_rs: float
    variacao_rs: float
    variacao_pct: float | None = None
    volume_base_kwh: float
    volume_atual_kwh: float
    efeito_preco_rs: float
    efeito_volume_rs: float
    efeito_mix_rs: float
    efeito_cruzado_rs: float
    segmentos: list[SegmentDecompositionDTO]


class KpiValueDTO(BaseModel):
    """Valor de um indicador na janela base e na janela atual, com a variação percentual entre elas."""

    base: float | None = None
    atual: float | None = None
    variacao_pct: float | None = None


class RevenueKpisDTO(BaseModel):
    """Indicadores executivos de receita comparando a janela base com a janela atual."""

    faturamento_rs: KpiValueDTO
    volume_kwh: KpiValueDTO
    tarifa_media_rs_kwh: KpiValueDTO
    ticket_medio_rs: KpiValueDTO
    ucs_ativas: KpiValueDTO


class BreakdownLevel(StrEnum):
    """Nível territorial ou de classe em que a variação de receita é detalhada."""

    MUNICIPIO = "municipio"
    BAIRRO = "bairro"
    CLASSE_CONSUMO = "classe_consumo"


class BreakdownSortField(StrEnum):
    """Coluna usada para ordenar o ranking do detalhamento."""

    EFEITO_VOLUME = "efeito_volume_rs"
    EFEITO_PRECO = "efeito_preco_rs"
    VARIACAO = "variacao_rs"
    RECEITA_ATUAL = "receita_atual_rs"


class SortOrder(StrEnum):
    """Sentido da ordenação."""

    ASC = "asc"
    DESC = "desc"


class BreakdownQuery(PaginationParams):
    """Parâmetros de nível, ordenação e paginação do detalhamento de receita."""

    nivel: BreakdownLevel = Field(default=BreakdownLevel.BAIRRO, description="Nível do detalhamento")
    ordenar_por: BreakdownSortField = Field(
        default=BreakdownSortField.EFEITO_VOLUME, description="Coluna usada na ordenação"
    )
    ordem: SortOrder = Field(default=SortOrder.ASC, description="asc coloca a maior perda de receita primeiro")


class BreakdownRowDTO(BaseModel):
    """Linha do ranking: variação de receita e seus efeitos para um município, bairro ou classe."""

    municipio: str | None = None
    bairro: str | None = None
    classe_consumo: str | None = None
    volume_base_kwh: float
    volume_atual_kwh: float
    variacao_volume_pct: float | None = None
    receita_base_rs: float
    receita_atual_rs: float
    variacao_rs: float
    efeito_preco_rs: float
    efeito_volume_rs: float
    efeito_cruzado_rs: float


class NeighborhoodHistoryRequest(BaseModel):
    """Bairro e janela da série mensal de volume, receita e tarifa média."""

    model_config = ConfigDict(frozen=True)

    municipio: str
    bairro: str
    classe_consumo: str | None = None
    competencia_fim: Competencia
    meses: int = Field(default=24, ge=1, le=60, description="Quantidade de competências, terminando em competencia_fim")


class MonthlyPointDTO(BaseModel):
    """Volume, receita e tarifa média de uma competência."""

    competencia: str
    volume_kwh: float
    receita_rs: float
    tarifa_media_rs_kwh: float | None = None


class NeighborhoodHistoryDTO(BaseModel):
    """Série mensal contínua de um bairro (meses sem faturamento aparecem com volume e receita zero)."""

    municipio: str
    bairro: str
    classe_consumo: str | None = None
    pontos: list[MonthlyPointDTO]