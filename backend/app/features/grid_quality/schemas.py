"""Schemas Pydantic da qualidade da rede (DEC/FEC por alimentador)."""

from enum import StrEnum

from pydantic import BaseModel


class QualityStatus(StrEnum):
    """Situação de um alimentador frente ao limite de DEC/FEC."""

    VIOLACAO = "violacao"
    ALERTA = "alerta"
    CONFORME = "conforme"


class FeederRankingDTO(BaseModel):
    """Alimentador no ranking de uma competência, com o excesso de DEC sobre o limite."""

    id_alimentador: str
    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None
    delta_dec_horas: float | None
    status: QualityStatus


class QualityIndicatorsDTO(BaseModel):
    """Indicadores consolidados de uma competência (média simples entre alimentadores)."""

    competencia: str | None
    dec_medio_horas: float
    fec_medio_vezes: float
    total_alimentadores: int
    alimentadores_em_violacao: int
    percentual_violacao: float


class FeederTimeSeriesPointDTO(BaseModel):
    """Ponto mensal da série histórica de um alimentador."""

    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None


class FeederTimeSeriesDTO(BaseModel):
    """Série histórica mensal de DEC/FEC de um alimentador, da mais antiga à mais recente."""

    id_alimentador: str
    pontos: list[FeederTimeSeriesPointDTO]
