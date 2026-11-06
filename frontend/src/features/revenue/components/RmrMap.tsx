import { RegionMap } from '@/components/data/RegionMap'
import type { BreakdownRow } from '@/features/revenue/types/revenueTypes'
import { formatSignedCompactCurrency } from '@/features/revenue/utils/revenueFormatters'
import { fillFor, metricValue, type TerritoryMetric } from '@/features/revenue/utils/territoryMetrics'
import { displayName } from '@/lib/geo/placeName'

interface RmrMapProps {
  rows: BreakdownRow[]
  metric: TerritoryMetric
  maximum: number
  selected?: string
  hovered: string | null
  onHover: (municipio: string | null) => void
  onSelect: (municipio: string) => void
}

/**
 * Mapa da RMR da Receita: cada município pintado pela métrica escolhida (verde ganho, vermelho perda).
 *
 * @param props - Linhas por município, métrica, escala, seleção e callbacks.
 * @returns Mapa compartilhado com a escala divergente da Receita.
 */
export function RmrMap({ rows, metric, maximum, ...interaction }: RmrMapProps) {
  const values = Object.fromEntries(rows.map((row) => [row.municipio ?? '', metricValue(row, metric)]))
  return (
    <RegionMap
      {...interaction}
      label="Mapa da Região Metropolitana do Recife"
      values={values}
      fillOf={(value) => fillFor(value, maximum)}
      describe={(municipio, value) =>
        `${displayName(municipio)}: ${value === undefined ? 'sem dados' : formatSignedCompactCurrency(value)}`}
    />
  )
}
