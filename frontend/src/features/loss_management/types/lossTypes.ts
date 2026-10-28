/** Ciclo de vida da ordem: gerada, depois pendente (em campo), depois concluida; cancelada a partir de gerada/pendente. */
export type InspectionStatus = 'gerada' | 'pendente' | 'concluida' | 'cancelada'

/** Motivos de suspeita calculados pelo backend. */
export type SuspicionReason = 'queda_subita' | 'queda_moderada' | 'leitura_zerada'

/** Situação da UC na fila: livre para ordem, com ordem gerada ou já em campo. */
export type QueueSituation = 'na_fila' | 'ordem_gerada' | 'em_campo'

/** UC da fila de suspeitas (`GET /losses/suspicious-units`). */
export interface SuspiciousUnit {
  id_uc: string
  municipio: string | null
  bairro: string | null
  classe_consumo: string | null
  motivos: SuspicionReason[]
  score_risco: number
  /** Prioridade de 0 a 100: kWh esperado da UC relativo ao topo da fila. */
  score: number
  situacao: QueueSituation
  /** Taxa histórica de inspeções que acharam irregularidade com este sinal (0 a 1). */
  probabilidade_acerto: number
  consumo_base_kwh: number
  consumo_recente_kwh: number
  kwh_estimado_recuperar: number
  valor_estimado_recuperar_rs: number
  /** Déficit mensal de consumo (kWh/mês). */
  kwh_mes_recuperavel: number
  /** kWh/mês recuperável x 12 x tarifa de referência. */
  valor_ano_rs: number
}

/** Avisos de degradação da análise devolvidos junto com a fila. */
export type QueueWarningCode = 'historico_campo_nao_aplicado' | 'competencia_referencia_fixada'

export interface QueueWarning {
  codigo: QueueWarningCode
  mensagem: string
}

/** Resposta de `GET /losses/suspicious-units`: UCs priorizadas e avisos (lista vazia = análise completa). */
export interface SuspiciousQueue {
  itens: SuspiciousUnit[]
  /** UCs que passam nos filtros, antes de cortar a fila no limite. */
  total: number
  avisos: QueueWarning[]
}

/** Filtros opcionais da fila de suspeitas. */
export interface SuspiciousUnitsFilter {
  municipio?: string
  bairro?: string
  classe?: string
  motivo?: SuspicionReason
  score_minimo?: number
}

/** Taxa histórica de inspeções que confirmaram irregularidade. */
export interface HitRate {
  inspecoes_total: number | null
  irregularidades_confirmadas: number | null
  taxa: number
  /** Primeira e última competência do histórico ('YYYY-MM'). */
  periodo_inicio: string | null
  periodo_fim: string | null
}

/** Cartões do topo da tela (`GET /losses/queue-summary`). */
export interface QueueSummary {
  capacidade_total: number
  capacidade_programada: number
  selecionadas: number
  kwh_mes_selecionadas: number
  valor_ano_selecionadas_rs: number
  tarifa_rs_kwh: number
  retorno_esperado_kwh_mes: number
  taxa_acerto: HitRate
}

/** Opções dos filtros de município e classe (`GET /losses/queue-filters`). */
export interface QueueFilterOptions {
  municipios: string[]
  classes: string[]
}

/** UC cuja ordem não pôde ser gerada em um lote, com o motivo. */
export interface BatchFailure {
  id_uc: string
  message: string
}

/** Resultado da geração de ordens em lote: o lote não aborta quando uma UC falha. */
export interface BatchResult {
  created: InspectionOrder[]
  failed: BatchFailure[]
}

/** Ordem de inspeção (`GET /losses/inspections`). */
export interface InspectionOrder {
  id_inspecao: number
  id_uc: string
  status: InspectionStatus
  motivo: string | null
  kwh_estimado: number
  fiscal_responsavel: string | null
  irregularidade_constatada: boolean | null
  tipo_irregularidade: string | null
  kwh_recuperado: number | null
  numero_toi: string | null
  justificativa_cancelamento: string | null
  criado_por: string
  criado_em: string
  atualizado_em: string
}

/** Payload de abertura de ordem a partir da fila (o kWh estimado é calculado pelo servidor). */
export interface InspectionOrderCreate {
  id_uc: string
  motivo?: string
}

/** Payload de mudança de status, resultado de campo ou cancelamento. */
export interface InspectionOrderUpdate {
  status: InspectionStatus
  fiscal_responsavel?: string
  irregularidade_constatada?: boolean
  tipo_irregularidade?: string
  kwh_recuperado?: number
  numero_toi?: string
  justificativa_cancelamento?: string
}

/** Linha da planilha de campo que não foi conciliada. */
export interface RejectedRow {
  aba: string | null
  linha: number
  id_inspecao: number | null
  motivo: string
}

/** Resumo da conciliação da planilha de retorno de campo. */
export interface UploadResult {
  conciliadas: number
  ignoradas: number
  rejeitadas: RejectedRow[]
  kwh_recuperado_total: number
}
