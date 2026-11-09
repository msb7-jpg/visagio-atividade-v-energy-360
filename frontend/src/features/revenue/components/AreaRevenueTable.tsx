import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaRevenueRow } from '@/features/revenue/components/AreaRevenueRow'
import type { NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
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
  monthsInWindow: number
  levelLabel: string
  sortField: AreaSortField
  selectedKey: string | null
  onSort: (field: AreaSortField) => void
  onSelect: (neighborhood: NeighborhoodRef | null) => void
}

/**
 * Receita, variação, volume e tarifa média de cada área em tabela ordenável.
 * Clicar em uma linha seleciona o bairro e atualiza o gráfico persistente ao lado.
 *
 * @param props - Áreas da página, rótulo do nível, ordenação e callbacks de seleção.
 * @returns Tabela com cabeçalhos ordenáveis e linhas selecionáveis.
 */
export function AreaRevenueTable({
  areas,
  monthsInWindow,
  levelLabel,
  sortField,
  selectedKey,
  onSort,
  onSelect
}: AreaRevenueTableProps) {
  return (
    <Table aria-label={`Receita por ${levelLabel.toLowerCase()}`}>
      <TableHeader>
        <TableRow>
          <TableHead>{levelLabel}</TableHead>
          {SORTABLE.map(({ field, label }) => (
            <TableHead key={field} className="text-right" aria-sort={sortField === field ? 'descending' : 'none'}>
              <Button variant="inline" size="inline" onClick={() => onSort(field)}>
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium tracking-wide uppercase',
                    sortField === field ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
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
          <AreaRevenueRow
            key={area.key}
            area={area}
            monthsInWindow={monthsInWindow}
            isSelected={selectedKey === area.key}
            onSelect={onSelect}
          />
        ))}
      </TableBody>
    </Table>
  )
}
