import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaRevenueRow } from '@/features/revenue/components/AreaRevenueRow'
import type { MonthlyPoint, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue, AreaSortField } from '@/features/revenue/utils/areaRevenue'
import { cn } from '@/lib/utils'

const SORTABLE: { field: AreaSortField; label: string }[] = [
  { field: 'revenue', label: 'Receita atual' },
  { field: 'revenuePct', label: 'Variação' },
  { field: 'volumeKwh', label: 'Volume atual' },
  { field: 'tariff', label: 'Tarifa média' }
]

interface AreaRevenueTableProps {
  areas: AreaRevenue[]
  /** Séries mensais dos bairros visíveis, por `município|bairro`. */
  histories: Map<string, MonthlyPoint[]>
  monthsInWindow: number
  levelLabel: string
  sortField: AreaSortField
  onSort: (field: AreaSortField) => void
  onOpen: (neighborhood: NeighborhoodRef) => void
}

/**
 * Receita, variação, volume e tarifa média de cada área, lado a lado; a coluna escolhida ordena do maior para o menor.
 * No nível de bairro, cada linha abre receita, volume e tarifa mês a mês; a comparação entre bairros fica no gráfico acima.
 *
 * @param props - Áreas da página, rótulo do nível, ordenação e callbacks.
 * @returns Tabela com cabeçalhos ordenáveis.
 */
export function AreaRevenueTable({ areas, histories, monthsInWindow, levelLabel, sortField, onSort, onOpen }: AreaRevenueTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const hasMonthly = areas.some((area) => area.neighborhood)
  const columnCount = SORTABLE.length + (hasMonthly ? 2 : 1)
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
          {hasMonthly ? <TableHead className="text-right">Mês a mês</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map((area) => (
          <AreaRevenueRow
            key={area.key}
            area={area}
            points={histories.get(area.key)}
            monthsInWindow={monthsInWindow}
            columnCount={columnCount}
            isExpanded={expanded === area.key}
            onToggle={() => setExpanded(expanded === area.key ? null : area.key)}
            onOpen={onOpen}
          />
        ))}
      </TableBody>
    </Table>
  )
}
