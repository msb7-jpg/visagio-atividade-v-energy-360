import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue, AreaSortField } from '@/features/revenue/utils/areaRevenue'
import { formatCompactCurrency, formatCurrency, formatMwh, formatTariff, formatVariation } from '@/features/revenue/utils/revenueFormatters'
import { cn } from '@/lib/utils'

const SORTABLE: { field: AreaSortField; label: string }[] = [
  { field: 'revenue', label: 'Receita atual' },
  { field: 'revenuePct', label: 'Variação' },
  { field: 'volumeKwh', label: 'Volume atual' },
  { field: 'tariff', label: 'Tarifa média' }
]

function toneOf(pct: number | null): string {
  if (pct === null || pct === 0) return 'text-muted-foreground'
  return pct > 0 ? 'text-success' : 'text-destructive'
}

function Change({ pct }: { pct: number | null }) {
  return <span className={cn('text-xs tabular-nums', toneOf(pct))}>{formatVariation(pct)}</span>
}

interface AreaRevenueTableProps {
  areas: AreaRevenue[]
  levelLabel: string
  sortField: AreaSortField
  onSort: (field: AreaSortField) => void
  onOpen: (neighborhood: NeighborhoodRef) => void
}

/**
 * Receita, variação, volume e tarifa média de cada área, lado a lado; a coluna escolhida ordena do maior para o menor.
 * No nível de bairro, o nome abre o histórico mensal.
 *
 * @param props - Áreas da página, rótulo do nível, ordenação e callbacks.
 * @returns Tabela com cabeçalhos ordenáveis.
 */
export function AreaRevenueTable({ areas, levelLabel, sortField, onSort, onOpen }: AreaRevenueTableProps) {
  return (
    <Table aria-label={`Receita por ${levelLabel.toLowerCase()}`}>
      <TableHeader>
        <TableRow>
          <TableHead>{levelLabel}</TableHead>
          {SORTABLE.map(({ field, label }) => (
            <TableHead key={field} className="text-right" aria-sort={sortField === field ? 'descending' : 'none'}>
              <Button variant="inline" size="inline" onClick={() => onSort(field)}>
                <span className={cn('flex items-center gap-1 text-xs font-medium tracking-wide uppercase', sortField === field ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                  {sortField === field ? <ArrowDown aria-hidden="true" className="size-3" /> : null}
                </span>
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map((area) => (
          <TableRow key={area.key}>
            <TableCell>
              <div className="flex max-w-60 flex-col items-start">
                {area.neighborhood ? (
                  <Button variant="inline" size="inline" title={`Ver 24 meses de ${area.name}`} onClick={() => area.neighborhood && onOpen(area.neighborhood)}>
                    <span className="block max-w-56 truncate">{area.name}</span>
                  </Button>
                ) : (
                  <span className="text-foreground font-medium">{area.name}</span>
                )}
                {area.place ? <span className="text-muted-foreground text-xs">{area.place}</span> : null}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-foreground font-semibold" title={formatCurrency(area.revenue)}>{formatCompactCurrency(area.revenue)}</span>
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
        ))}
      </TableBody>
    </Table>
  )
}
