export type ExclusionReason =
  | 'possui_gd'
  | 'inspecionada_sem_achado'
  | 'irregularidade_recente'
  | 'cancelamento_bloqueante'

export interface ExcludedUnit {
  id_uc: string
  municipio: string | null
  bairro: string | null
  classe_consumo: string | null
  motivo_exclusao: ExclusionReason
  data_evento: string | null
  volta_a_ser_avaliada: string | null
}

export interface ExclusionCount {
  motivo: ExclusionReason
  total: number
}

export interface ExcludedQueue {
  itens: ExcludedUnit[]
  total: number
  resumo: ExclusionCount[]
}

export interface ExcludedUnitsFilter {
  motivo?: ExclusionReason
  offset?: number
}
