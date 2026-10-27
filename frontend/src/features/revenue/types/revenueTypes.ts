/** Indicador nas duas janelas, com a variação percentual entre elas (`null` quando não há base comparável). */
export interface KpiValue {
  base: number | null
  atual: number | null
  variacao_pct: number | null
}

/** Resposta de `GET /revenue/kpis`. */
export interface RevenueKpis {
  faturamento_rs: KpiValue
  volume_kwh: KpiValue
  tarifa_media_rs_kwh: KpiValue
  ticket_medio_rs: KpiValue
  ucs_ativas: KpiValue
}

/** Janela de competências consecutivas (`YYYY-MM`, limites incluídos). */
export interface PeriodWindow {
  inicio: string
  fim: string
}

/** Recortes opcionais aplicados a todas as consultas de receita. */
export interface RevenueFilters {
  municipio?: string
  bairro?: string
  classe_consumo?: string
}

/** Janela base, janela atual e recortes escolhidos na tela. */
export interface RevenueQuery {
  base: PeriodWindow
  atual: PeriodWindow
  filters: RevenueFilters
}

/** Resposta de `GET /revenue/decomposition` (a soma dos quatro efeitos é a variação total). */
export interface PriceVolumeDecomposition {
  receita_base_rs: number
  receita_atual_rs: number
  variacao_rs: number
  variacao_pct: number | null
  volume_base_kwh: number
  volume_atual_kwh: number
  efeito_preco_rs: number
  efeito_volume_rs: number
  efeito_mix_rs: number
  efeito_cruzado_rs: number
}

/** Nível em que o ranking detalha a variação de receita. */
export type BreakdownLevel = 'bairro' | 'municipio' | 'classe_consumo'

/** Coluna aceita pela API para ordenar o ranking. */
export type BreakdownSortField = 'efeito_volume_rs' | 'efeito_preco_rs' | 'variacao_rs' | 'receita_atual_rs'

/** Sentido da ordenação (`asc` põe a maior perda primeiro). */
export type SortOrder = 'asc' | 'desc'

/** Nível, ordenação e página escolhidos no ranking. */
export interface BreakdownControls {
  nivel: BreakdownLevel
  ordenar_por: BreakdownSortField
  ordem: SortOrder
  page: number
  page_size: number
}

/** Linha do ranking: variação de receita e seus efeitos para um município, bairro ou classe. */
export interface BreakdownRow {
  municipio: string | null
  bairro: string | null
  classe_consumo: string | null
  volume_base_kwh: number
  volume_atual_kwh: number
  variacao_volume_pct: number | null
  receita_base_rs: number
  receita_atual_rs: number
  variacao_rs: number
  efeito_preco_rs: number
  efeito_volume_rs: number
  efeito_cruzado_rs: number
}

/** Resposta paginada de `GET /revenue/breakdown`. */
export interface BreakdownPage {
  items: BreakdownRow[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** Bairro escolhido no ranking para abrir o histórico. */
export interface NeighborhoodRef {
  municipio: string
  bairro: string
}

/** Volume, receita e tarifa média de uma competência. */
export interface MonthlyPoint {
  competencia: string
  volume_kwh: number
  receita_rs: number
  tarifa_media_rs_kwh: number | null
}

/** Resposta de `GET /revenue/history`: série mensal contínua (meses sem faturamento vêm zerados). */
export interface NeighborhoodHistory {
  municipio: string
  bairro: string
  classe_consumo: string | null
  pontos: MonthlyPoint[]
}
