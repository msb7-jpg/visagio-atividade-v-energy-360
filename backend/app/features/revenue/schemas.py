from typing import Annotated, Self
 
from pydantic import BaseModel, ConfigDict, Field, model_validator
 
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