import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { MonthlyBreakdown } from '@/features/revenue/components/MonthlyBreakdown'
import type { MonthlyPoint, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue } from '@/features/revenue/utils/areaRevenue'
import { formatCompactCurrency, formatCurrency, formatMwh, formatTariff, formatVariation } from '@/features/revenue/utils/revenueFormatters'
import { cn } from '@/lib/utils'

function toneOf(pct: number | null): string {
  if (pct === null || pct === 0) return 'text-muted-foreground'
  return pct > 0 ? 'text-success' : 'text-destructive'
}

function Change({ pct }: { pct: number | null }) {
  return <span className={cn('text-xs tabular-nums', toneOf(pct))}>{formatVariation(pct)}</span>
}

interface AreaRevenueRowProps {
  area: AreaRevenue
  /** Série mensal do bairro; ausente no nível de município ou enquanto carrega. */
  points: MonthlyPoint[] | undefined
  /** Meses do período analisado, para a receita média por mês. */
  monthsInWindow: number
  columnCount: number
  isExpanded: boolean
  onToggle: () => void
  onOpen: (neighborhood: NeighborhoodRef) => void
}

/**
 * Linha de uma área: receita do período e média por mês, variação, volume, tarifa e, no bairro, o
 * botão "Mês a mês", que abre receita, volume e tarifa de cada mês logo abaixo da linha.
 *
 * @param props - Área, série mensal, meses da janela, estado da abertura e callbacks.
 * @returns A linha e, aberta, a linha extra com a grade mensal.
 */
export function AreaRevenueRow({ area, points, monthsInWindow, columnCount, isExpanded, onToggle, onOpen }: AreaRevenueRowProps) {
  const neighborhood = area.neighborhood
  return (
    <>
      <TableRow data-state={isExpanded ? 'selected' : undefined}>
        <TableCell>
          <div className="flex max-w-60 flex-col items-start">
            {neighborhood ? (
              <Button variant="inline" size="inline" title={`Ver 24 meses de ${area.name}`} onClick={() => onOpen(neighborhood)}>
                <span className="block max-w-56 truncate">{area.name}</span>
              </Button>
            ) : (
              <span className="text-foreground font-medium">{area.name}</span>
            )}
            {area.place ? <span className="text-muted-foreground text-xs">{area.place}</span> : null}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className="text-foreground font-semibold" title={formatCurrency(area.revenue)}>{formatCompactCurrency(area.revenue)}</span>
            <span className="text-muted-foreground text-xs">{formatCompactCurrency(area.revenue / monthsInWindow)}/mês</span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <Change pct={area.revenuePct} />
            <span className="text-muted-foreground text-xs">base {formatCompactCurrency(area.revenueBase)}</span>
          </div>
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">{formatMwh(area.volumeKwh)}</TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className="whitespace-nowrap">{formatTariff(area.tariff)}</span>
            <Change pct={area.tariffPct} />
          </div>
        </TableCell>
        {neighborhood ? (
          <TableCell>
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mês a mês"
                title="Ver receita, volume e tarifa mês a mês"
                aria-expanded={isExpanded}
                disabled={!points}
                onClick={onToggle}
              >
                <ChevronDown aria-hidden="true" className={cn('transition-transform', isExpanded ? 'rotate-180' : null)} />
              </Button>
            </div>
          </TableCell>
        ) : null}
      </TableRow>
      {isExpanded && points ? (
        <TableRow>
          <TableCell colSpan={columnCount}>
            <div className="bg-muted/40 border-border rounded-md border p-3">
              <MonthlyBreakdown points={points} />
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
