import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { BreakdownRow } from '@/features/revenue/types/revenueTypes'
import { formatSignedCompactCurrency } from '@/features/revenue/utils/revenueFormatters'
import { metricValue, type TerritoryMetric } from '@/features/revenue/utils/territoryMetrics'
import { displayName } from '@/lib/geo/placeName'
import { cn } from '@/lib/utils'

interface MunicipalityBarsProps {
  rows: BreakdownRow[]
  metric: TerritoryMetric
  maximum: number
  selected?: string
  hovered: string | null
  onHover: (municipio: string | null) => void
  onSelect: (municipio: string) => void
}

function DivergingBar({ value, maximum }: { value: number; maximum: number }) {
  const width = { '--bar-width': `${(Math.abs(value) / maximum) * 100}%` } as CSSProperties
  return (
    <div className="grid grid-cols-2" aria-hidden="true">
      <div className="border-border flex justify-end border-r">
        {value < 0 ? <div className="bg-destructive h-3 w-(--bar-width) rounded-l-sm" style={width} /> : null}
      </div>
      <div className="flex">
        {value >= 0 ? <div className="bg-success h-3 w-(--bar-width) rounded-r-sm" style={width} /> : null}
      </div>
    </div>
  )
}

/**
 * Municípios em barras divergentes a partir do zero, do maior ganho para a maior perda.
 * O nome aplica o filtro de município; passar o mouse destaca o município no mapa.
 *
 * @param props - Linhas por município, métrica, escala, seleção e callbacks.
 * @returns Lista ordenada com nome, barra e valor.
 */
export function MunicipalityBars({ rows, metric, maximum, selected, hovered, onHover, onSelect }: MunicipalityBarsProps) {
  const sorted = [...rows].sort((left, right) => metricValue(right, metric) - metricValue(left, metric))
  return (
    <ol className="flex flex-col" aria-label="Municípios pela métrica escolhida">
      {sorted.map((row) => {
        const municipio = row.municipio ?? ''
        const value = metricValue(row, metric)
        const isActive = hovered === municipio || selected === municipio
        return (
          <li
            key={municipio}
            className={cn('grid grid-cols-5 items-center gap-3 rounded-sm px-2 py-1.5', isActive ? 'bg-muted' : null)}
            onMouseEnter={() => onHover(municipio)}
            onMouseLeave={() => onHover(null)}
          >
            <span className="col-span-2 min-w-0 truncate text-sm">
              <Button variant="inline" size="inline" aria-pressed={selected === municipio} onClick={() => onSelect(municipio)}>
                {displayName(municipio)}
              </Button>
            </span>
            <span className="col-span-2">
              <DivergingBar value={value} maximum={maximum} />
            </span>
            <span className={cn('text-right text-sm font-medium tabular-nums', value < 0 ? 'text-destructive' : 'text-success')}>
              {formatSignedCompactCurrency(value)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
