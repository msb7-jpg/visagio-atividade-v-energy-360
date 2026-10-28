import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { formatCurrency, formatMwh, formatTariff } from '@/features/revenue/utils/revenueFormatters'

export type HistoryMetricKey = 'receita_rs' | 'volume_kwh' | 'tarifa_media_rs_kwh'

/** Métrica da série mensal: rótulo da aba, nome da série e como formatar o valor. */
export interface HistoryMetric {
  key: HistoryMetricKey
  tabLabel: string
  seriesLabel: string
  format: (value: number | null) => string
}

export const HISTORY_METRICS: HistoryMetric[] = [
  { key: 'receita_rs', tabLabel: 'Receita', seriesLabel: 'Receita mensal', format: formatCurrency },
  { key: 'volume_kwh', tabLabel: 'Volume', seriesLabel: 'Volume faturado', format: formatMwh },
  { key: 'tarifa_media_rs_kwh', tabLabel: 'Tarifa', seriesLabel: 'Tarifa média', format: formatTariff }
]

/**
 * Converte o valor de cada mês em altura relativa (0 a 100) da maior barra da série.
 *
 * @param points - Série mensal do bairro.
 * @param metric - Métrica exibida.
 * @returns Alturas em porcentagem, uma por mês; meses sem valor ficam em zero.
 */
export function toBarHeights(points: MonthlyPoint[], metric: HistoryMetricKey): number[] {
  const values = points.map((point) => point[metric] ?? 0)
  const peak = Math.max(...values, 0)
  return values.map((barValue) => (peak > 0 ? (barValue / peak) * 100 : 0))
}
