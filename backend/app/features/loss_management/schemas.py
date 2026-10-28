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
    QUEDA_MODERADA = "queda_moderada"
    LEITURA_ZERADA = "leitura_zerada"


class QueueSituation(StrEnum):
    """Situação da UC na fila: livre para ordem, com ordem gerada ou já em campo."""

    NA_FILA = "na_fila"
    ORDEM_GERADA = "ordem_gerada"
    EM_CAMPO = "em_campo"


FILA_CAPACIDADE_MENSAL = 200  # "mais de 200 inspeções por mês" (Gerente de Perdas, atividade.pdf)


class SuspiciousUnitsFilterDTO(BaseModel):
    """Filtros territoriais, de classe e tamanho da fila de suspeitas (query params)."""

    municipio: str | None = None
    bairro: str | None = None
    classe: str | None = None
    motivo: SuspicionReason | None = None
    score_minimo: int = Field(default=0, ge=0, le=100, description="Só UCs com score a partir deste valor")
    limit: int = Field(default=FILA_CAPACIDADE_MENSAL, ge=1, le=500)


class SuspiciousUnitDTO(BaseModel):
    id_uc: str
    municipio: str | None
    bairro: str | None
    classe_consumo: str | None
    motivos: list[SuspicionReason]
    score_risco: float = Field(ge=0, le=100, description="Intensidade do sinal de suspeita (0-100); só desempata")
    score: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Prioridade (0-100): kWh esperado da UC relativo ao topo da fila (chance x energia recuperável)",
    )
    situacao: QueueSituation = QueueSituation.NA_FILA
    probabilidade_acerto: float = Field(
        ge=0, le=1, description="Taxa histórica de inspeções que acharam irregularidade com este sinal (0-1)"
    )
    consumo_base_kwh: float
    consumo_recente_kwh: float
    kwh_estimado_recuperar: float
    valor_estimado_recuperar_rs: float
    kwh_mes_recuperavel: float = Field(description="Déficit mensal de consumo (base - recente), em kWh/mês")
    valor_ano_rs: float = Field(description="kWh/mês recuperável x 12 x tarifa de referência")


class QueueWarningCode(StrEnum):
    """Avisos que a fila devolve quando precisou degradar a análise."""

    HISTORICO_CAMPO_NAO_APLICADO = "historico_campo_nao_aplicado"
    COMPETENCIA_REFERENCIA_FIXADA = "competencia_referencia_fixada"


class QueueWarningDTO(BaseModel):
    """Aviso de que a fila foi montada com a análise degradada."""

    codigo: QueueWarningCode
    mensagem: str = Field(description="Explicação do aviso para exibir ao usuário")


class SuspiciousQueueDTO(BaseModel):
    """Fila de suspeitas com os avisos de degradação da análise (lista vazia = análise completa)."""

    itens: list[SuspiciousUnitDTO]
    total: int = Field(description="UCs que passam nos filtros, antes de cortar a fila no `limit`")
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


class RejectedRowDTO(BaseModel):
    """Linha da planilha de campo que não foi conciliada, com o motivo."""

    aba: str | None = Field(description="Aba do .xlsx; vazio para CSV")
    linha: int = Field(description="Número da linha na planilha (cabeçalho = 1)")
    id_inspecao: int | None
    motivo: str


class UploadResultDTO(BaseModel):
    """Resumo da conciliação da planilha de retorno de campo."""

    conciliadas: int = Field(description="Ordens concluídas a partir da planilha")
    ignoradas: int = Field(description="Linhas sem resultado preenchido (ainda em campo)")
    rejeitadas: list[RejectedRowDTO]
    kwh_recuperado_total: float = Field(description="Soma do kWh recuperado das ordens conciliadas")


class HitRateDTO(BaseModel):
    """Taxa histórica de inspeções que confirmaram irregularidade (`fato_inspecoes_perdas`)."""

    inspecoes_total: int | None = Field(description="Inspeções no histórico; vazio se a tabela não foi exportada")
    irregularidades_confirmadas: int | None
    taxa: float = Field(ge=0, le=1, description="Confirmadas / total; sem histórico usa a taxa geral já medida")
    periodo_inicio: str | None = Field(description="Primeira competência do histórico ('YYYY-MM')")
    periodo_fim: str | None = Field(description="Última competência do histórico ('YYYY-MM')")


class QueueSummaryDTO(BaseModel):
    """Cartões do topo da tela: capacidade do mês, energia das selecionadas, retorno esperado e taxa histórica."""

    capacidade_total: int = Field(description="Inspeções que a equipe faz por mês")
    capacidade_programada: int = Field(description="Ordens ativas (geradas ou em campo)")
    selecionadas: int = Field(description="UCs selecionadas que ainda estão na fila, sem ordem")
    kwh_mes_selecionadas: float
    valor_ano_selecionadas_rs: float
    tarifa_rs_kwh: float
    retorno_esperado_kwh_mes: float = Field(description="Energia das selecionadas x taxa histórica de acerto")
    taxa_acerto: HitRateDTO


class QueueFiltersDTO(BaseModel):
    """Opções dos filtros da tela, vindas do cadastro de UCs."""

    municipios: list[str]
    classes: list[str]
