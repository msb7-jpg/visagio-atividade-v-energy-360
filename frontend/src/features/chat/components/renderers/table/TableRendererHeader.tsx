import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { SortDirection } from '@/features/chat/components/renderers/table/hooks/useTableSort'

interface TableRendererHeaderProps {
  headers: string[]
  sortColIndex: number | null
  sortDirection: SortDirection
  onSort: (columnIndex: number) => void
}

/**
 * Cabeçalho da tabela analítica com botões interativos de ordenação por coluna.
 *
 * @param props - Propriedades de cabeçalho e estado de ordenação.
 * @returns Elemento JSX com as colunas interativas.
 */
export function TableRendererHeader({
  headers,
  sortColIndex,
  sortDirection,
  onSort
}: TableRendererHeaderProps) {
  if (headers.length === 0) return null

  const renderSortIcon = (columnIndex: number) => {
    if (sortColIndex !== columnIndex) {
      return <ArrowUpDown className="size-3 text-muted-foreground opacity-40 group-hover/col:opacity-100" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="size-3 text-primary" />
    }
    return <ArrowDown className="size-3 text-primary" />
  }

  return (
    <thead className="border-b border-border bg-card font-semibold text-foreground">
      <tr>
        {headers.map((header, columnIndex) => (
          <th
            key={`${header}-${String(columnIndex)}`}
            onClick={() => onSort(columnIndex)}
            className="group/col cursor-pointer select-none px-4 py-3 text-sm font-semibold capitalize tracking-normal text-foreground transition-colors hover:text-primary"
          >
            <div className="flex items-center gap-1.5">
              <span>{header}</span>
              {renderSortIcon(columnIndex)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}
