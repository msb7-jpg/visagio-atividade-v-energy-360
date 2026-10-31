"""Schemas Pydantic da qualidade da rede (DEC/FEC por alimentador)."""

from enum import StrEnum

from pydantic import BaseModel


class QualityStatus(StrEnum):
    """Situação de um alimentador frente ao limite de DEC/FEC."""

    VIOLACAO = "violacao"
    ALERTA = "alerta"
    CONFORME = "conforme"


class FeederRankingDTO(BaseModel):
    """Alimentador no ranking de uma competência.

    `dec_apurado_horas` e `fec_apurado_vezes` são do mês; os limites são anuais e o status e o
    `delta_dec_horas` (acumulado no ano menos o limite) usam o acumulado no ano.
    """

    id_alimentador: str
    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_acumulado_ano_horas: float
    fec_acumulado_ano_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None
    delta_dec_horas: float | None
    status: QualityStatus
    conjunto_aneel: str | None
    criterio_limite: str | None
    ucs_atendidas: int | None


class QualityIndicatorsDTO(BaseModel):
    """Indicadores consolidados de uma competência (média simples entre alimentadores).

    DEC e FEC médios são do acumulado no ano até a competência; a violação compara o acumulado
    com o limite anual.
    """

    competencia: str | None
    dec_medio_horas: float
    fec_medio_vezes: float
    total_alimentadores: int
    alimentadores_em_violacao: int
    percentual_violacao: float
    alimentadores_em_alerta: int
    percentual_alerta: float
    alimentadores_conformes: int
    percentual_conforme: float


class FeederTimeSeriesPointDTO(BaseModel):
    """Ponto mensal da série histórica: DEC/FEC do mês, acumulado no ano e limites anuais."""

    competencia: str
    dec_apurado_horas: float
    fec_apurado_vezes: float
    dec_acumulado_ano_horas: float
    fec_acumulado_ano_vezes: float
    dec_limite_horas: float | None
    fec_limite_vezes: float | None
    conjunto_aneel: str | None
    criterio_limite: str | None
    ucs_atendidas: int | None


class FeederTimeSeriesDTO(BaseModel):
    """Série histórica mensal de DEC/FEC de um alimentador, da mais antiga à mais recente."""

    id_alimentador: str
    pontos: list[FeederTimeSeriesPointDTO]
