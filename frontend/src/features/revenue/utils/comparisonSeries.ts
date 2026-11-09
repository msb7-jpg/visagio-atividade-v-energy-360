import { formatCompactCurrency, formatCurrency } from '@/features/revenue/utils/revenueFormatters'
import type { HistoryMetric } from '@/features/revenue/utils/revenueHistoryMetrics'

/** Tokens de série do gráfico (design.md, `--chart-1…5`), um por bairro comparado. */
export const SERIES_TOKENS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const

/**
 * Cor do traço da série. Usa `--chart-N` (definido em `:root` e `.dark`) e não `--color-chart-N`: o Tailwind v4
 * só emite no CSS final os `--color-*` que aparecem escritos no código, e `-2` e `-3` não aparecem, então o traço sumia.
 *
 * @param index - Posição da série (0 a 4).
 * @returns Valor CSS como `var(--chart-2)`.
 */
export function seriesStroke(index: number): string {
  return `var(--${SERIES_TOKENS[index]})`
}

/**
 * Formatação dos rótulos do eixo Y: receita compacta, tarifa em reais com duas casas ("R$ 0,75") e volume em MWh.
 *
 * @param metric - Métrica exibida no gráfico.
 * @returns Função que formata o valor de um tick.
 */
export function axisFormatOf(metric: HistoryMetric): (value: number | null) => string {
  if (metric.key === 'receita_rs') return formatCompactCurrency
  if (metric.key === 'tarifa_media_rs_kwh') return formatCurrency
  return metric.format
}

const TARIFF_STEP = 0.05

type DomainBound = number | string | ((value: number) => number)

/**
 * Faixa do eixo Y. Receita e volume partem do zero, que mostra o tamanho de cada bairro. A tarifa varia poucos
 * centavos entre bairros: a partir do zero as linhas se sobrepõem, então o eixo vai do menor ao maior valor,
 * arredondados para a casa de R$ 0,05 abaixo e acima.
 *
 * @param metric - Métrica exibida no gráfico.
 * @returns Limites inferior e superior do eixo, no formato do Recharts.
 */
export function axisDomainOf(metric: HistoryMetric): [DomainBound, DomainBound] {
  if (metric.key !== 'tarifa_media_rs_kwh') return [0, 'auto']
  return [
    (dataMin: number) => Math.max(0, Math.floor(dataMin / TARIFF_STEP) * TARIFF_STEP),
    (dataMax: number) => Math.ceil(dataMax / TARIFF_STEP) * TARIFF_STEP
  ]
}

/**
 * Diz se o eixo Y começa acima de zero, para a tela avisar o leitor.
 *
 * @param metric - Métrica exibida no gráfico.
 * @returns Verdadeiro para a tarifa.
 */
export function isZoomedAxis(metric: HistoryMetric): boolean {
  return metric.key === 'tarifa_media_rs_kwh'
}
