import type { BreakdownRow } from '@/features/revenue/types/revenueTypes'

/** Número que pinta o mapa e ordena as barras dos municípios. */
export type TerritoryMetric = 'variacao_rs' | 'efeito_preco_rs' | 'efeito_volume_rs'

export const TERRITORY_METRICS: { value: TerritoryMetric; label: string }[] = [
  { value: 'variacao_rs', label: 'Variação' },
  { value: 'efeito_preco_rs', label: 'Efeito-preço' },
  { value: 'efeito_volume_rs', label: 'Efeito-volume' }
]

const SHADES = 4
const POSITIVE_FILL = ['fill-success/25', 'fill-success/45', 'fill-success/65', 'fill-success/90']
const NEGATIVE_FILL = ['fill-destructive/25', 'fill-destructive/45', 'fill-destructive/65', 'fill-destructive/90']

/**
 * Valor de uma linha do ranking para a métrica escolhida no mapa.
 *
 * @param row - Linha do ranking por município.
 * @param metric - Variação total ou um dos efeitos.
 * @returns O valor em reais.
 */
export function metricValue(row: BreakdownRow, metric: TerritoryMetric): number {
  return row[metric]
}

/**
 * Maior valor absoluto da métrica entre os municípios: é o 100% das barras e o tom mais forte do mapa.
 *
 * @param rows - Linhas por município.
 * @param metric - Métrica escolhida.
 * @returns O maior valor absoluto, ou 1 quando todos são zero.
 */
export function maxAbsolute(rows: BreakdownRow[], metric: TerritoryMetric): number {
  return Math.max(1, ...rows.map((row) => Math.abs(metricValue(row, metric))))
}

/**
 * Classe de preenchimento do município no mapa: verde para ganho, vermelho para perda, mais forte quanto maior.
 *
 * @param value - Valor da métrica no município.
 * @param maximum - Maior valor absoluto entre os municípios.
 * @returns Classe Tailwind de preenchimento.
 */
export function fillFor(value: number, maximum: number): string {
  const shade = Math.min(SHADES - 1, Math.floor((Math.abs(value) / maximum) * SHADES))
  return value >= 0 ? POSITIVE_FILL[shade] : NEGATIVE_FILL[shade]
}
