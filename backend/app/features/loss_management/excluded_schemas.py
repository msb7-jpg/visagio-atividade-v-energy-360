"""Schemas da aba "Fora da fila": UCs com queda de consumo que a fila deixou de fora."""

from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field

from app.features.loss_management.schemas import FILA_CAPACIDADE_MENSAL


class ExclusionReason(StrEnum):
    """Motivos pelos quais uma UC com queda de consumo está fora da fila (os que o backend de fato produz)."""

    POSSUI_GD = "possui_gd"
    INSPECIONADA_SEM_ACHADO = "inspecionada_sem_achado"
    IRREGULARIDADE_RECENTE = "irregularidade_recente"
    CANCELAMENTO_BLOQUEANTE = "cancelamento_bloqueante"


class ExcludedUnitsFilterDTO(BaseModel):
    """Filtro e página da aba "Fora da fila" (query params)."""

    motivo: ExclusionReason | None = None
    limit: int = Field(default=FILA_CAPACIDADE_MENSAL, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class ExcludedUnitDTO(BaseModel):
    """UC avaliada (queda de consumo) e excluída da fila, com o motivo e a data de reavaliação."""

    id_uc: str
    municipio: str | None
    bairro: str | None
    classe_consumo: str | None
    motivo_exclusao: ExclusionReason
    data_evento: date | None = Field(description="Data da inspeção ou do cancelamento que causou a exclusão")
    volta_a_ser_avaliada: date | None = Field(description="Primeiro dia em que a UC pode voltar; vazio sem regra")


class ExclusionCountDTO(BaseModel):
    """Quantas UCs estão fora da fila por um motivo."""

    motivo: ExclusionReason
    total: int


class ExcludedQueueDTO(BaseModel):
    """Aba "Fora da fila": UCs excluídas (página pedida), o total e o resumo por motivo."""

    itens: list[ExcludedUnitDTO]
    total: int
    resumo: list[ExclusionCountDTO]
