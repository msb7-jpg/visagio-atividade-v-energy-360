import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import type { BreakdownControls, BreakdownSortField, SortOrder } from '@/features/revenue/types/revenueTypes'

interface SortableHeadProps {
  field: BreakdownSortField
  label: string
  controls: BreakdownControls
  onSort: (field: BreakdownSortField) => void
}

function sortIndicator(isActive: boolean, order: SortOrder) {
  if (!isActive) {
    return { ariaSort: 'none', icon: <ChevronsUpDown className="size-3.5" /> } as const
  }
  return order === 'asc'
    ? ({ ariaSort: 'ascending', icon: <ArrowUp className="size-3.5" /> } as const)
    : ({ ariaSort: 'descending', icon: <ArrowDown className="size-3.5" /> } as const)
}

/**
 * Cabeçalho de coluna ordenável: botão com seta que indica a ordenação ativa.
 *
 * @param props - Campo da API, rótulo, ordenação atual e callback de clique.
 * @returns Célula de cabeçalho com `aria-sort` correto.
 */
export function SortableHead({ field, label, controls, onSort }: SortableHeadProps) {
  const { ariaSort, icon } = sortIndicator(controls.ordenar_por === field, controls.ordem)
  return (
    <TableHead className="text-right" aria-sort={ariaSort}>
      <Button variant="ghost" size="sm" onClick={() => onSort(field)}>
        <span className="flex items-center gap-1">
          {label} {icon}
        </span>
      </Button>
    </TableHead>
  )
}
