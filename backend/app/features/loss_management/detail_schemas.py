"""Schemas do detalhe de uma UC da Fila de Inspeção (leitura)."""

from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field

from app.features.loss_management.schemas import QueueSituation, SuspicionReason


class PriorInspectionSource(StrEnum):
    """De onde vem a inspeção anterior: o histórico de campo (Gold) ou uma ordem concluída no portal."""

    HISTORICO_CAMPO = "historico_campo"
    ORDEM_PORTAL = "ordem_portal"


class MonthlyConsumptionDTO(BaseModel):
    competencia: str = Field(description="Competência no formato 'YYYY-MM'")
    consumo_kwh: float | None = Field(
        description="Consumo medido no mês; vazio quando não há leitura válida (mês sem leitura ou leitura negativa)"
    )


class PriorInspectionDTO(BaseModel):
    origem: PriorInspectionSource
    data_inspecao: date | None = Field(description="Vazio quando a ordem concluída não registrou a data")
    irregularidade_constatada: bool | None = Field(description="Resultado da inspeção; vazio se não registrado")
    inspetor: str | None = Field(description="Código do inspetor (INSP-001 a INSP-040); vazio se não registrado")


class ScoreBreakdownDTO(BaseModel):
    """Os números da conta do score: kWh recuperável x chance de acerto = kWh esperado; score = esperado / topo."""

    kwh_mes_recuperavel: float = Field(description="Déficit mensal de consumo (base - recente), em kWh/mês")
    meses_janela_recuperacao: int = Field(description="Meses de déficit somados para estimar a energia a recuperar")
    kwh_janela_recuperavel: float = Field(
        description="kWh/mês recuperável x meses da janela; é a energia que entra na conta do score"
    )
    probabilidade_acerto: float = Field(ge=0, le=1, description="Chance de a inspeção achar irregularidade (0-1)")
    kwh_esperado: float = Field(description="kWh da janela x probabilidade de acerto")
    maior_kwh_esperado_fila: float = Field(description="Maior kWh esperado entre todas as UCs da fila (o topo)")
    score: int = Field(ge=0, le=100, description="kWh esperado / maior kWh esperado da fila x 100, arredondado")


class UnitDetailDTO(BaseModel):
    id_uc: str
    municipio: str | None
    bairro: str | None
    classe_consumo: str | None
    situacao: QueueSituation = Field(description="Na fila, ordem gerada ou em campo (UC já inspecionada sai da fila)")
    competencia_referencia: str = Field(description="Última competência da análise ('YYYY-MM')")
    motivos: list[SuspicionReason]
    motivo_resumo: str = Field(description="Frase em pt-BR gerada a partir dos números reais da UC")
    consumo_base_kwh: float = Field(description="Média mensal do período anterior (até 12 competências com leitura)")
    consumo_recente_kwh: float = Field(description="Média mensal das 3 últimas competências")
    decomposicao_score: ScoreBreakdownDTO
    consumo_mensal: list[MonthlyConsumptionDTO] = Field(
        description="12 competências em ordem crescente, terminando na de referência"
    )
    inspecoes_anteriores: list[PriorInspectionDTO] = Field(description="Da mais recente para a mais antiga")
