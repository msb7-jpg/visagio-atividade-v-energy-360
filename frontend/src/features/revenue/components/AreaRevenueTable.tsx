import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaRevenueRow } from '@/features/revenue/components/AreaRevenueRow'
import type { NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue, AreaSort, AreaSortField } from '@/features/revenue/utils/areaRevenue'
import { cn } from '@/lib/utils'

const SORTABLE: { field: AreaSortField; label: string }[] = [
  { field: 'revenue', label: 'Receita atual' },
  { field: 'revenuePct', label: 'Variação' },
  { field: 'volumeKwh', label: 'Volume atual' },
  { field: 'tariff', label: 'Tarifa média' }
]

const SORT_ARIA = { asc: 'ascending', desc: 'descending' } as const

interface AreaRevenueTableProps {
  areas: AreaRevenue[]
  monthsInWindow: number
  levelLabel: string
  sort: AreaSort
  selectedKey: string | null
  onSort: (field: AreaSortField) => void
  onSelect: (neighborhood: NeighborhoodRef | null) => void
}

/**
 * Receita, variação, volume e tarifa média de cada área em tabela ordenável: clicar no cabeçalho ordena do maior
 * para o menor, e clicar de novo inverte.
 * Clicar em uma linha seleciona o bairro e atualiza o gráfico persistente ao lado.
 *
 * @param props - Áreas da página, rótulo do nível, ordenação e callbacks de seleção.
 * @returns Tabela com cabeçalhos ordenáveis e linhas selecionáveis.
 */
export function AreaRevenueTable({
  areas,
  monthsInWindow,
  levelLabel,
  sort,
  selectedKey,
  onSort,
  onSelect
}: AreaRevenueTableProps) {
  return (
    <Table aria-label={`Receita por ${levelLabel.toLowerCase()}`}>
      <TableHeader>
        <TableRow>
          <TableHead>{levelLabel}</TableHead>
          {SORTABLE.map(({ field, label }) => {
            const isActive = sort.field === field
            const Arrow = sort.direction === 'desc' ? ArrowDown : ArrowUp
            return (
              <TableHead key={field} className="text-right" aria-sort={isActive ? SORT_ARIA[sort.direction] : 'none'}>
                <Button variant="inline" size="inline" onClick={() => onSort(field)}>
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium tracking-wide uppercase',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                    {isActive ? <Arrow aria-hidden="true" className="size-3" /> : null}
                  </span>
                </Button>
              </TableHead>
            )
          })}
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
