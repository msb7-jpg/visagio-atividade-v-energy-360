export type ConsumptionTrend = 'SUBIU' | 'ESTAVEL' | 'CAIU' | 'SEM_COMPARACAO'

export interface CustomerSummary {
  id_uc: string
  nome_titular: string | null
  codigo_cliente: string | null
  classe_consumo: string | null
  subgrupo_tarifario: string | null
  municipio: string | null
  bairro: string | null
  alimentador: string | null
  subestacao: string | null
  numero_medidor_ativo: string | null
  possui_gd: boolean
  potencia_gd_kw: number | null
  data_conexao_gd: string | null
}

export interface SolarGeneration {
  hasSolar: boolean
  connectedAt: string | null
}

export interface CustomerSearchResult {
  id_uc: string
  nome_titular: string | null
  numero_medidor_ativo: string | null
  bairro: string | null
  municipio: string | null
  classe_consumo: string | null
  possui_gd: boolean
}

export interface Invoice {
  id_fatura: string
  competencia: string
  data_vencimento: string | null
  data_pagamento: string | null
  valor_total_rs: number | null
  consumo_faturado_kwh: number | null
  bandeira_tarifaria: string | null
  tarifa_aplicada_rs_kwh: number | null
  status_pagamento: string | null
}

export interface MonthlyComparison {
  competencia: string
  competencia_ano_anterior: string
  consumo_kwh: number | null
  consumo_kwh_ano_anterior: number | null
  variacao_consumo_pct: number | null
  valor_total_rs: number | null
  valor_total_rs_ano_anterior: number | null
  variacao_valor_pct: number | null
  bandeira_tarifaria: string | null
  dias_faturamento: number | null
  dias_faturamento_ano_anterior: number | null
  media_diaria_kwh: number | null
  media_diaria_kwh_ano_anterior: number | null
  variacao_media_diaria_pct: number | null
  tarifa_rs_kwh: number | null
  tarifa_rs_kwh_ano_anterior: number | null
  variacao_tarifa_pct: number | null
  tipo_leitura: string | null
}

export interface HighBillDiagnosis {
  competencia_referencia: string
  competencia_comparada: string
  consumo_kwh: number | null
  consumo_kwh_ano_anterior: number | null
  variacao_consumo_pct: number | null
  tendencia_consumo: ConsumptionTrend
  bandeira_atual: string | null
  bandeira_ano_anterior: string | null
  bandeira_mudou: boolean
  dias_faturamento: number | null
  dias_faturamento_ano_anterior: number | null
  media_diaria_kwh: number | null
  media_diaria_kwh_ano_anterior: number | null
  variacao_media_diaria_pct: number | null
  tendencia_media_diaria: ConsumptionTrend
  tarifa_rs_kwh: number | null
  tarifa_rs_kwh_ano_anterior: number | null
  variacao_tarifa_pct: number | null
  leitura_estimada: boolean
}

export interface YearOverYearTotals {
  meses_comparados: number
  consumo_kwh: number
  consumo_kwh_ano_anterior: number
  variacao_consumo_pct: number | null
  valor_total_rs: number | null
  valor_total_rs_ano_anterior: number | null
  variacao_valor_pct: number | null
}

export interface PaymentPunctuality {
  faturas_avaliadas: number
  pagas_em_dia: number
  pagas_com_atraso: number
  atraso_medio_dias: number | null
  vencidas_em_aberto: number
}

export interface CustomerHistory {
  id_uc: string
  competencia_referencia: string | null
  meses: MonthlyComparison[]
  resumo_12_meses: YearOverYearTotals | null
  diagnostico: HighBillDiagnosis | null
  faturas: Invoice[]
  faturas_em_aberto: Invoice[]
  valor_em_aberto_rs: number
  pontualidade: PaymentPunctuality | null
}

export interface FeederQualityMonth {
  competencia: string
  dec_apurado_horas: number | null
  fec_apurado_vezes: number | null
  dec_limite_aneel: number | null
  fec_limite_aneel: number | null
  violou_meta: boolean
}

export interface ServiceTicket {
  id_atendimento: string
  numero_protocolo: string | null
  motivo_chamado: string | null
  data_abertura: string | null
  status_chamado: string | null
  nota_csat: number | null
}

export interface UnitOutage {
  id_ocorrencia: string
  competencia: string | null
  inicio_interrupcao: string | null
  fim_interrupcao: string | null
  duracao_horas: number | null
  tipo_ocorrencia: string | null
  causa: string | null
}

/** Totais de todas as interrupções da UC, e não só das listadas (a lista traz as 50 mais recentes). */
export interface UnitOutageSummary {
  total_interrupcoes: number
  total_horas: number
  mais_longa: UnitOutage | null
}

export interface LossInspection {
  id_inspecao: string
  data_inspecao: string | null
  id_inspetor: string | null
  irregularidade_constatada: boolean | null
  tipo_irregularidade: string | null
  kwh_recuperado: number | null
}

export interface CustomerEventTimeline {
  id_uc: string
  alimentador: string | null
  qualidade_alimentador: FeederQualityMonth[]
  interrupcoes_uc: UnitOutage[]
  resumo_interrupcoes_uc: UnitOutageSummary
  chamados: ServiceTicket[]
  inspecoes: LossInspection[]
}
