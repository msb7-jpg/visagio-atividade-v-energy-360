import { TableCell, TableRow } from '@/components/ui/table'
import type { NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue } from '@/features/revenue/utils/areaRevenue'
import {
  formatCompactCurrency,
  formatCurrency,
  formatMwh,
  formatTariff,
  formatVariation
} from '@/features/revenue/utils/revenueFormatters'
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
  monthsInWindow: number
  isSelected: boolean
  onSelect: (neighborhood: NeighborhoodRef | null) => void
}

/**
 * Linha de uma área: receita do período e média por mês, variação, volume e tarifa média.
 * Ao clicar na linha de um bairro, seleciona-o para exibição no gráfico persistente ao lado.
 *
 * @param props - Área, meses da janela, estado de seleção e callback de clique.
 * @returns Linha formatada da tabela.
 */
export function AreaRevenueRow({ area, monthsInWindow, isSelected, onSelect }: AreaRevenueRowProps) {
  const neighborhood = area.neighborhood
  return (
    <TableRow
      data-state={isSelected ? 'selected' : undefined}
      className={neighborhood ? 'cursor-pointer' : undefined}
      onClick={() => onSelect(neighborhood ?? null)}
    >
      <TableCell>
        <div className="flex flex-col items-start">
          <span className="text-foreground font-medium">{area.name}</span>
          {area.place ? <span className="text-muted-foreground text-xs">{area.place}</span> : null}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="text-foreground font-semibold" title={formatCurrency(area.revenue)}>
            {formatCompactCurrency(area.revenue)}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatCompactCurrency(area.revenue / monthsInWindow)}/mês
          </span>
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
    </TableRow>
  )
}
