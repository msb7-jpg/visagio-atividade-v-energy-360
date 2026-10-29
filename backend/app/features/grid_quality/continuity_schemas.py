"""Schemas da visão de Continuidade; o JSON segue o `ContinuitySnapshot` do frontend (camelCase)."""

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ContinuityModel(BaseModel):
    """Base dos DTOs da Continuidade: campos em snake_case no Python e camelCase no JSON."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PeriodComparisonDTO(ContinuityModel):
    """Valor do período B, do período A e a variação percentual de B sobre A."""

    current: float
    previous: float
    change_percent: float


class ContinuityKpisDTO(ContinuityModel):
    """DEC, FEC, interrupções e duração média, cada um com B contra A."""

    dec: PeriodComparisonDTO
    fec: PeriodComparisonDTO
    interruptions: PeriodComparisonDTO
    average_duration_hours: PeriodComparisonDTO


class ContinuityEventDTO(ContinuityModel):
    """Mês extremo detectado na rede inteira, com os números do escopo selecionado."""

    competencia: str
    event_interruptions: int
    other_months_median: float
    dec_without_event: float
    fec_without_event: float


class MunicipalityDecDTO(ContinuityModel):
    """DEC do período B de um município, com a posição de referência no mapa."""

    name: str
    latitude: float
    longitude: float
    dec_hours: float


class FeederUcHoursDTO(ContinuityModel):
    """Alimentador no período B: DEC, FEC, UC-horas e DEC do período A."""

    id_alimentador: str = Field(alias="id_alimentador")
    municipality: str
    ucs_served: int
    dec_hours: float
    fec_times: float
    interruptions: int
    uc_hours: float
    network_share_percent: float
    dec_previous_hours: float
    small_sample: bool


class CauseShareDTO(ContinuityModel):
    """Participação de uma causa nas UC-horas do período B."""

    cause: str
    share_percent: float
    actionable: bool


class TypeShareDTO(ContinuityModel):
    """Participação de um tipo de ocorrência nas interrupções do período B."""

    type: str
    share_percent: float


class ContinuitySnapshotDTO(ContinuityModel):
    """Visão de Continuidade completa; `event` é nulo quando nenhum mês passa do limiar."""

    kpis: ContinuityKpisDTO
    event: ContinuityEventDTO | None
    municipalities: list[MunicipalityDecDTO]
    feeders: list[FeederUcHoursDTO]
    causes: list[CauseShareDTO]
    types: list[TypeShareDTO]


class AffectedCustomerDTO(BaseModel):
    """UC com mais horas sem energia em um alimentador, com o mínimo para identificá-la."""

    id_uc: str
    nome_titular: str | None
    bairro: str | None
    municipio: str | None
    horas_sem_energia: float
    ocorrencias: int
