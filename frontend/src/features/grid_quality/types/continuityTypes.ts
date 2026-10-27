/** Linha de `fato_qualidade_alimentador` (Gold da Fatia 02): 1 alimentador × 1 competência. */
export interface QualityFeederRow {
  id_alimentador: string
  competencia: string
  ucs_atendidas: number
  ucs_interrompidas: number
  dec_apurado_horas: number
  fec_apurado_vezes: number
}

/** Linha de `fato_ocorrencias_rede` (Gold da Fatia 02): 1 UC interrompida por ocorrência. */
export interface NetworkOccurrenceRow {
  id_ocorrencia: string
  id_uc: string
  id_alimentador: string
  tipo_ocorrencia: string
  causa: string
  inicio_interrupcao: string
  duracao_horas: number
  competencia: string
}

/** Município da RMR com o código usado no meio de `id_alimentador` (ex.: `ALM-JAB-016`). */
export interface MunicipalityRef {
  code: string
  name: string
  latitude: number
  longitude: number
}

/** Linhas cruas e parâmetros dos períodos comparados (B contra A). */
export interface ContinuityDataset {
  quality: QualityFeederRow[]
  occurrences: NetworkOccurrenceRow[]
  municipalities: MunicipalityRef[]
  periodA: string[]
  periodB: string[]
  eventCompetencia: string
}

export interface ContinuityFilters {
  includeEventMonth: boolean
  /** Nome do município; vazio traz todos. */
  municipality: string
}

/** Valor do período B, do período A e a variação percentual de B sobre A. */
export interface PeriodComparison {
  current: number
  previous: number
  changePercent: number
}

export interface ContinuityKpis {
  dec: PeriodComparison
  fec: PeriodComparison
  interruptions: PeriodComparison
  averageDurationHours: PeriodComparison
}

export interface ContinuityEvent {
  competencia: string
  eventInterruptions: number
  otherMonthsMedian: number
  decWithoutEvent: number
  fecWithoutEvent: number
}

export interface MunicipalityDec {
  name: string
  latitude: number
  longitude: number
  decHours: number
}

export interface FeederUcHours {
  id_alimentador: string
  municipality: string
  ucsServed: number
  decHours: number
  fecTimes: number
  interruptions: number
  ucHours: number
  networkSharePercent: number
  decPreviousHours: number
  smallSample: boolean
}

export interface CauseShare {
  cause: string
  sharePercent: number
  actionable: boolean
}

export interface TypeShare {
  type: string
  sharePercent: number
}

export interface ContinuitySnapshot {
  kpis: ContinuityKpis
  event: ContinuityEvent
  municipalities: MunicipalityDec[]
  feeders: FeederUcHours[]
  causes: CauseShare[]
  types: TypeShare[]
}
