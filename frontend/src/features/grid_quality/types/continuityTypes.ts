/** Filtros da Continuidade enviados à API. */
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

/** DEC, FEC, interrupções e duração média, cada um com B contra A. */
export interface ContinuityKpis {
  dec: PeriodComparison
  fec: PeriodComparison
  interruptions: PeriodComparison
  averageDurationHours: PeriodComparison
}

/** Mês extremo detectado na rede inteira, com os números do escopo selecionado. */
export interface ContinuityEvent {
  competencia: string
  eventInterruptions: number
  otherMonthsMedian: number
  decWithoutEvent: number
  fecWithoutEvent: number
}

/** DEC do período B de um município e a posição de referência no mapa. */
export interface MunicipalityDec {
  name: string
  latitude: number
  longitude: number
  decHours: number
}

/** Alimentador no período B: DEC, FEC, UC-horas e DEC do período A. */
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

/** Participação de uma causa nas UC-horas do período B. */
export interface CauseShare {
  cause: string
  sharePercent: number
  actionable: boolean
}

/** Participação de um tipo de ocorrência nas interrupções do período B. */
export interface TypeShare {
  type: string
  sharePercent: number
}

/** Visão de Continuidade devolvida por `GET /quality/continuity`; `event` é nulo se nenhum mês passa do limiar. */
export interface ContinuitySnapshot {
  kpis: ContinuityKpis
  event: ContinuityEvent | null
  municipalities: MunicipalityDec[]
  feeders: FeederUcHours[]
  causes: CauseShare[]
  types: TypeShare[]
}
