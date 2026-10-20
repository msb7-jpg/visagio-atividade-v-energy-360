"""Schemas Pydantic da Visão 360 da Unidade Consumidora (cadastro, histórico e eventos)."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class ConsumptionTrend(StrEnum):
    """Veredito da comparação de consumo do mês de referência contra o mesmo mês do ano anterior."""

    SUBIU = "SUBIU"
    ESTAVEL = "ESTAVEL"
    CAIU = "CAIU"
    SEM_COMPARACAO = "SEM_COMPARACAO"


class GoldRowModel(BaseModel):
    """Base das linhas lidas das tabelas Gold: aceita IDs numéricos ou textuais vindos do SQLite."""

    model_config = ConfigDict(coerce_numbers_to_str=True)


class CustomerSummaryDTO(GoldRowModel):
    """Cadastro da UC lido de `dim_unidade_consumidora`."""

    id_uc: str
    nome_titular: str | None = None
    codigo_cliente: str | None = None
    classe_consumo: str | None = None
    subgrupo_tarifario: str | None = None
    municipio: str | None = None
    bairro: str | None = None
    alimentador: str | None = None
    subestacao: str | None = None
    numero_medidor_ativo: str | None = None
    possui_gd: bool = False
    potencia_gd_kw: float | None = None


class InvoiceDTO(GoldRowModel):
    """Fatura mensal lida de `fato_faturamento`."""

    id_fatura: str
    competencia: str
    data_vencimento: str | None = None
    data_pagamento: str | None = None
    valor_total_rs: float | None = None
    consumo_faturado_kwh: float | None = None
    bandeira_tarifaria: str | None = None
    tarifa_aplicada_rs_kwh: float | None = None
    status_pagamento: str | None = None


class MeasurementDTO(GoldRowModel):
    """Consumo medido em uma competência, lido de `fato_medicao`."""

    competencia: str
    consumo_kwh: float | None = None


class MonthlyComparisonDTO(BaseModel):
    """Um mês da janela de 12 meses ao lado do mesmo mês do ano anterior (YoY)."""

    competencia: str
    competencia_ano_anterior: str
    consumo_kwh: float | None = None
    consumo_kwh_ano_anterior: float | None = None
    variacao_consumo_pct: float | None = None
    valor_total_rs: float | None = None
    valor_total_rs_ano_anterior: float | None = None
    variacao_valor_pct: float | None = None
    bandeira_tarifaria: str | None = None


class HighBillDiagnosisDTO(BaseModel):
    """Resposta estruturada para a reclamação de conta alta no mês de referência."""

    competencia_referencia: str
    competencia_comparada: str
    consumo_kwh: float | None = None
    consumo_kwh_ano_anterior: float | None = None
    variacao_consumo_pct: float | None = None
    tendencia_consumo: ConsumptionTrend
    bandeira_atual: str | None = None
    bandeira_ano_anterior: str | None = None
    bandeira_mudou: bool = False


class CustomerHistoryDTO(BaseModel):
    """Histórico de consumo YoY, faturas e diagnóstico de conta alta da UC."""

    id_uc: str
    competencia_referencia: str | None = None
    meses: list[MonthlyComparisonDTO]
    diagnostico: HighBillDiagnosisDTO | None = None
    faturas: list[InvoiceDTO]
    faturas_em_aberto: list[InvoiceDTO]
    valor_em_aberto_rs: float


class FeederQualityMonthDTO(GoldRowModel):
    """Continuidade mensal (DEC/FEC) do alimentador, lida de `fato_qualidade_alimentador`."""

    competencia: str
    dec_apurado_horas: float | None = None
    fec_apurado_vezes: float | None = None
    dec_limite_aneel: float | None = None
    fec_limite_aneel: float | None = None
    violou_meta: bool = False


class ServiceTicketDTO(GoldRowModel):
    """Chamado aberto pela UC no call center, lido de `fato_atendimentos`."""

    id_atendimento: str
    numero_protocolo: str | None = None
    motivo_chamado: str | None = None
    data_abertura: str | None = None
    status_chamado: str | None = None
    nota_csat: float | None = None


class CustomerEventTimelineDTO(BaseModel):
    """Interrupções no alimentador da UC e chamados abertos por ela."""

    id_uc: str
    alimentador: str | None = None
    qualidade_alimentador: list[FeederQualityMonthDTO]
    chamados: list[ServiceTicketDTO]
