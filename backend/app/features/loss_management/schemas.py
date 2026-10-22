"""Schemas Pydantic da gestão de perdas não técnicas e ordens de inspeção."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class InspectionStatus(StrEnum):
    """Ciclo de vida de uma ordem de inspeção em campo."""

    GERADA = "gerada"
    PENDENTE = "pendente"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class SuspicionReason(StrEnum):
    """Motivos que colocam uma UC na fila de suspeitas."""

    QUEDA_SUBITA = "queda_subita"
    LEITURA_ZERADA = "leitura_zerada"


FILA_CAPACIDADE_MENSAL = 200  # "mais de 200 inspeções por mês" (Gerente de Perdas, atividade.pdf)


class SuspiciousUnitsFilterDTO(BaseModel):
    """Filtros territoriais, de classe e tamanho da fila de suspeitas (query params)."""

    municipio: str | None = None
    bairro: str | None = None
    classe: str | None = None
    limit: int = Field(default=FILA_CAPACIDADE_MENSAL, ge=1, le=500)


class SuspiciousUnitDTO(BaseModel):
    id_uc: str
    municipio: str | None
    bairro: str | None
    classe_consumo: str | None
    motivos: list[SuspicionReason]
    score_risco: float = Field(ge=0, le=100, description="Probabilidade relativa de irregularidade (0-100)")
    consumo_base_kwh: float
    consumo_recente_kwh: float
    kwh_estimado_recuperar: float
    valor_estimado_recuperar_rs: float


class QueueWarningCode(StrEnum):
    """Avisos que a fila devolve quando precisou degradar a análise."""

    HISTORICO_CAMPO_NAO_APLICADO = "historico_campo_nao_aplicado"


class QueueWarningDTO(BaseModel):
    """Aviso de que a fila foi montada com a análise degradada."""

    codigo: QueueWarningCode
    mensagem: str = Field(description="Explicação do aviso para exibir ao usuário")


class SuspiciousQueueDTO(BaseModel):
    """Fila de suspeitas com os avisos de degradação da análise (lista vazia = análise completa)."""

    itens: list[SuspiciousUnitDTO]
    avisos: list[QueueWarningDTO]


class InspectionOrderCreateDTO(BaseModel):
    """Abertura de ordem: o kWh estimado é calculado pelo servidor, nunca aceito do cliente."""

    model_config = ConfigDict(extra="forbid")

    id_uc: str = Field(min_length=1, max_length=20)
    motivo: str | None = Field(default=None, max_length=200)
    fiscal_responsavel: str | None = Field(default=None, max_length=120)


class InspectionOrderUpdateDTO(BaseModel):
    status: InspectionStatus
    fiscal_responsavel: str | None = Field(default=None, max_length=120)
    irregularidade_constatada: bool | None = None
    tipo_irregularidade: str | None = Field(default=None, max_length=80)
    kwh_recuperado: float | None = Field(default=None, ge=0)
    numero_toi: str | None = Field(default=None, max_length=40)
    justificativa_cancelamento: str | None = Field(default=None, max_length=500)


class InspectionOrderDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_inspecao: int
    id_uc: str
    status: InspectionStatus
    motivo: str | None
    kwh_estimado: float
    fiscal_responsavel: str | None
    irregularidade_constatada: bool | None
    tipo_irregularidade: str | None
    kwh_recuperado: float | None
    numero_toi: str | None
    justificativa_cancelamento: str | None
    criado_por: str
    criado_em: datetime
    atualizado_em: datetime
