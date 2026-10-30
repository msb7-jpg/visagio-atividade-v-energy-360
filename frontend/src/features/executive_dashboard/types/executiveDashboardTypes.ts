/** Unidade do valor do indicador; a formatação fica no frontend (contrato do Painel, seção 6). */
export type IndicatorUnit = 'RS' | 'KWH' | 'RS_KWH' | 'UCS' | 'PCT' | 'NOTA' | 'HORAS' | 'VEZES'

/** Sentido em que o indicador é bom para a empresa. */
export type IndicatorDirection = 'MAIOR_MELHOR' | 'MENOR_MELHOR' | 'NEUTRO'

/** Leitura da variação feita pelo backend. */
export type IndicatorEvaluation = 'MELHOROU' | 'PIOROU' | 'ESTAVEL' | 'SEM_COMPARACAO' | 'INFORMATIVO'

/** Janela de competências `YYYY-MM`, limites incluídos. */
export interface PeriodWindow {
  competencia_inicio: string
  competencia_fim: string
}

/** Valor de apoio de um indicador nas duas janelas (ex.: valor vencido em reais da inadimplência). */
export interface IndicatorDetail {
  titulo: string
  unidade: IndicatorUnit
  base: number | null
  atual: number | null
}

/** Um indicador com o valor das duas janelas, a variação e a avaliação. */
export interface Indicator {
  id: string
  titulo: string
  unidade: IndicatorUnit
  base: number | null
  atual: number | null
  variacao_pct: number | null
  /** Só nos indicadores em % (`PCT`): diferença em pontos percentuais, usada na avaliação. */
  variacao_pp: number | null
  sentido: IndicatorDirection
  avaliacao: IndicatorEvaluation
  explicacao: string
  detalhe: IndicatorDetail | null
  aviso: string | null
}

/** Indicadores de uma área do negócio. */
export interface IndicatorGroup {
  id: string
  titulo: string
  indicadores: Indicator[]
}

/** Resposta de `GET /dashboard/indicators`. */
export interface DashboardIndicators {
  base: PeriodWindow
  atual: PeriodWindow
  periodo_disponivel: PeriodWindow | null
  grupos: IndicatorGroup[]
}

/** Resposta de `GET /dashboard/losses`: retrato atual da Fila de Perdas. */
export interface LossesSnapshot {
  competencia_referencia: string | null
  /** A competência foi fixada na configuração (demonstração), e não é a mais recente. */
  competencia_fixada: boolean
  /** UCs da fila de qualquer chance de acerto. */
  ucs_na_fila: number
  /** UCs com chance de acerto de 30% ou mais, como na aba "Prioritárias" da Fila de Inspeção. */
  ucs_prioritarias: number
  energia_prioritaria_kwh_mes: number
  /** Valor por ano se todas as UCs prioritárias confirmarem a irregularidade. */
  valor_prioritario_rs_ano: number
  /** Valor por ano das UCs prioritárias ponderado pela chance de acerto de cada uma. */
  retorno_esperado_rs_ano: number
  taxa_acerto_pct: number
  inspecoes_avaliadas: number | null
}

/** Janelas comparadas no Painel. */
export interface DashboardPeriods {
  base: PeriodWindow
  atual: PeriodWindow
}
