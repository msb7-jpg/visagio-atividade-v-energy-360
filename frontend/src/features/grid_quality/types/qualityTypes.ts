export type QualityStatus = 'violacao' | 'alerta' | 'conforme'

// `CONJUNTO`: limite do conjunto elétrico; `MEDIANA_RMR`: limite aproximado (ADR-003).
export type LimitCriterion = 'CONJUNTO' | 'MEDIANA_RMR'

export interface QualityIndicators {
  competencia: string | null
  dec_medio_horas: number
  fec_medio_vezes: number
  total_alimentadores: number
  alimentadores_em_violacao: number
  percentual_violacao: number
}

export interface FeederRanking {
  id_alimentador: string
  competencia: string
  dec_apurado_horas: number
  fec_apurado_vezes: number
  dec_acumulado_ano_horas: number
  fec_acumulado_ano_vezes: number
  dec_limite_horas: number | null
  fec_limite_vezes: number | null
  delta_dec_horas: number | null
  status: QualityStatus
  conjunto_aneel: string | null
  criterio_limite: LimitCriterion | null
  ucs_atendidas: number | null
}

export interface FeederHistoryPoint {
  competencia: string
  dec_apurado_horas: number
  fec_apurado_vezes: number
  dec_acumulado_ano_horas: number
  fec_acumulado_ano_vezes: number
  dec_limite_horas: number | null
  fec_limite_vezes: number | null
  conjunto_aneel: string | null
  criterio_limite: LimitCriterion | null
  ucs_atendidas: number | null
}

export interface FeederHistory {
  id_alimentador: string
  pontos: FeederHistoryPoint[]
}

/** UC com mais horas sem energia em um alimentador (`GET /quality/feeders/{id}/customers`). */
export interface AffectedCustomer {
  id_uc: string
  nome_titular: string | null
  bairro: string | null
  municipio: string | null
  horas_sem_energia: number
  ocorrencias: number
}
