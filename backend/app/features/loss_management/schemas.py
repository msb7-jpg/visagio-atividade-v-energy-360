"""Schemas Pydantic da gestão de perdas não técnicas e ordens de inspeção."""

import re
from datetime import UTC, date, datetime
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

INSPECTOR_CODE = re.compile(r"INSP-(\d{3})")
FIRST_INSPECTOR_NUMBER = 1
LAST_INSPECTOR_NUMBER = 40


class InspectionStatus(StrEnum):
    """Ciclo de vida de uma ordem de inspeção em campo."""

    GERADA = "gerada"
    PENDENTE = "pendente"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class CancellationReason(StrEnum):
    """Lista fechada de motivos para cancelar uma ordem (a única fonte; o rótulo em pt-BR fica no frontend)."""

    CLIENTE_REGULARIZOU = "cliente_regularizou"
    ORDEM_DUPLICADA = "ordem_duplicada"
    ENDERECO_NAO_LOCALIZADO = "endereco_nao_localizado"
    REPRIORIZACAO_EQUIPE = "repriorizacao_equipe"
    OUTRO = "outro"


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
    limit: int = Field(default=FILA_CAPACIDADE_MENSAL, ge=1, le=500)
    offset: int = Field(default=0, ge=0, description="UCs da fila ignoradas antes da página (paginação)")


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
    meses_base: int = Field(
        default=12, ge=0, description="Meses com leitura na janela de base da UC (menos de 11 = ligação recente)"
    )
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
    total: int = Field(description="UCs que passam nos filtros, antes de cortar a página (`offset` e `limit`)")
    avisos: list[QueueWarningDTO]


class InspectionOrderCreateDTO(BaseModel):
    """Abertura de ordem: o kWh estimado é calculado pelo servidor, nunca aceito do cliente."""

    model_config = ConfigDict(extra="forbid")

    id_uc: str = Field(min_length=1, max_length=20)
    motivo: str | None = Field(default=None, max_length=200)
    fiscal_responsavel: str | None = Field(default=None, max_length=120)


def normalize_inspector_code(raw: str) -> str:
    """Padroniza e valida o código do inspetor (INSP-001 a INSP-040).

    Raises:
        ValueError: Se o código não estiver no formato ou fora da faixa de inspetores.
    """
    code = raw.strip().upper()
    code_match = INSPECTOR_CODE.fullmatch(code)
    if code_match is None or not FIRST_INSPECTOR_NUMBER <= int(code_match.group(1)) <= LAST_INSPECTOR_NUMBER:
        raise ValueError(f"Inspetor '{raw.strip()}' inválido: use um código de INSP-001 a INSP-040.")
    return code


def ensure_not_future_date(inspection_date: date) -> date:
    """Garante que a data da inspeção não é posterior a hoje (UTC, o mesmo relógio de `criado_em`).

    Raises:
        ValueError: Se a data for futura.
    """
    if inspection_date > datetime.now(UTC).date():
        raise ValueError("A data da inspeção não pode ser futura.")
    return inspection_date


class InspectionOrderUpdateDTO(BaseModel):
    status: InspectionStatus
    fiscal_responsavel: str | None = Field(default=None, max_length=120)
    inspetor: str | None = Field(default=None, description="Código do inspetor, de INSP-001 a INSP-040")
    data_inspecao: date | None = Field(default=None, description="Data em que a inspeção foi feita (não futura)")
    irregularidade_constatada: bool | None = None
    tipo_irregularidade: str | None = Field(default=None, max_length=80)
    kwh_recuperado: float | None = Field(default=None, ge=0)
    numero_toi: str | None = Field(default=None, max_length=40)
    justificativa_cancelamento: str | None = Field(default=None, max_length=500)
    motivo_cancelamento: CancellationReason | None = Field(
        default=None, description="Obrigatório ao cancelar; vem da lista fechada de motivos"
    )

    @field_validator("inspetor")
    @classmethod
    def _validate_inspector(cls, inspector: str | None) -> str | None:
        return None if inspector is None else normalize_inspector_code(inspector)

    @field_validator("data_inspecao")
    @classmethod
    def _validate_inspection_date(cls, inspection_date: date | None) -> date | None:
        return None if inspection_date is None else ensure_not_future_date(inspection_date)

    @model_validator(mode="after")
    def _require_cancellation_reason(self) -> Self:
        if self.status == InspectionStatus.CANCELADA and self.motivo_cancelamento is None:
            raise ValueError("Informe o motivo do cancelamento.")
        return self


class InspectionOrderDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_inspecao: int
    id_uc: str
    status: InspectionStatus
    motivo: str | None
    kwh_estimado: float
    fiscal_responsavel: str | None
    inspetor: str | None
    data_inspecao: date | None
    irregularidade_constatada: bool | None
    tipo_irregularidade: str | None
    kwh_recuperado: float | None
    numero_toi: str | None
    justificativa_cancelamento: str | None
    motivo_cancelamento: CancellationReason | None
    criado_por: str
    criado_em: datetime
    atualizado_em: datetime
    municipio: str | None = Field(default=None, description="Município da UC no cadastro; preenchido só na listagem")
    bairro: str | None = Field(default=None, description="Bairro da UC no cadastro; preenchido só na listagem")
    classe_consumo: str | None = Field(default=None, description="Classe da UC no cadastro; preenchido só na listagem")


class InspectorDTO(BaseModel):
    """Inspetor de campo do histórico de inspeções; a base não guarda nome, só o código."""

    codigo: str = Field(description="Código do inspetor, de INSP-001 a INSP-040")


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
    tarifa_rs_kwh: float = Field(
        description="Tarifa média ponderada (receita ÷ energia faturada) dos 12 meses de referência, em R$/kWh"
    )
    tarifa_periodo_inicio: str = Field(description="Primeira competência da tarifa ('YYYY-MM')")
    tarifa_periodo_fim: str = Field(description="Última competência da tarifa ('YYYY-MM')")
    retorno_esperado_kwh_mes: float = Field(
        description="Soma, por UC selecionada, de kWh/mês recuperável x chance de acerto da UC"
    )
    retorno_esperado_valor_ano_rs: float = Field(
        description="Soma, por UC selecionada, de valor anual recuperável x chance de acerto da UC"
    )
    taxa_acerto: HitRateDTO


class QueueFiltersDTO(BaseModel):
    """Opções dos filtros da tela, vindas do cadastro de UCs."""

    municipios: list[str]
    classes: list[str]
