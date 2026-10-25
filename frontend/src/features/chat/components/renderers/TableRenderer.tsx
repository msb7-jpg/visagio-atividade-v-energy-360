import { useMemo, useRef, type ReactNode } from 'react'
import { TableRendererHeader } from '@/features/chat/components/renderers/table/TableRendererHeader'
import { TableRendererMenu } from '@/features/chat/components/renderers/table/TableRendererMenu'
import { TableRendererPagination } from '@/features/chat/components/renderers/table/TableRendererPagination'
import { useTableExport } from '@/features/chat/components/renderers/table/hooks/useTableExport'
import { useTablePagination } from '@/features/chat/components/renderers/table/hooks/useTablePagination'
import { useTableSort } from '@/features/chat/components/renderers/table/hooks/useTableSort'
import {
  extractTableFromChildren,
  extractTableFromRows
} from '@/features/chat/components/renderers/table/lib/tableParsers'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização da tabela rica analítica com ordenação e paginação.
 */
export interface TableRendererProps {
  /** Nós filhos React contendo a tabela HTML ou Markdown compilada. */
  children?: ReactNode
  /** Registros brutos do SQLite para renderização direta. */
  rows?: Record<string, unknown>[]
  /**
   * Quantidade de linhas por página.
   * @defaultValue `10`
   */
  pageSize?: number
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Componente de tabela rica interativa com ordenação por coluna, paginação e exportação TSV/CSV.
 *
 * @param props - Propriedades de configuração dos dados e paginação da tabela.
 * @returns Elemento JSX da tabela estilizada com barra de ferramentas e paginação.
 */
export function TableRenderer({
  children,
  rows,
  pageSize = 10,
  className
}: TableRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { headers, tableData } = useMemo(() => {
    if (rows && rows.length > 0) {
      return extractTableFromRows(rows)
    }
    if (children) {
      return extractTableFromChildren(children)
    }
    return { headers: [], tableData: [] }
  }, [rows, children])

  const { sortColIndex, sortDirection, sortedData, handleSort } = useTableSort(tableData)
  const { currentPage, totalPages, paginatedData, goToPrevPage, goToNextPage, resetPage } =
    useTablePagination(sortedData, pageSize)
  const { menuRef, isMenuOpen, isCopied, setIsMenuOpen, handleCopy, handleExportCsv } =
    useTableExport(headers, sortedData)

  const handleColumnSort = (columnIndex: number) => {
    handleSort(columnIndex)
    resetPage()
  }

  if (headers.length === 0 && tableData.length === 0) {
    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="table-renderer-container"
      className={cn(
        'group relative my-4 overflow-hidden rounded-xl border border-border bg-card/60 shadow-md backdrop-blur-sm',
        className
      )}
    >
      <TableRendererMenu
        menuRef={menuRef}
        isMenuOpen={isMenuOpen}
        isCopied={isCopied}
        onToggleMenu={() => setIsMenuOpen(prev => !prev)}
        onCopy={handleCopy}
        onExportCsv={handleExportCsv}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <TableRendererHeader
            headers={headers}
            sortColIndex={sortColIndex}
            sortDirection={sortDirection}
            onSort={handleColumnSort}
          />
          <tbody className="divide-y divide-border">
            {paginatedData.map((rowItem, rowIdx) => (
              <tr
                key={`${rowItem.cells[0] || 'row'}-${String(rowIdx)}`}
                className="transition-colors hover:bg-muted/30"
              >
                {rowItem.cells.map((cell, colIdx) => (
                  <td
                    key={`${headers[colIdx] || 'col'}-${String(colIdx)}`}
                    className="px-4 py-3 text-sm text-foreground whitespace-nowrap"
                  >
                    {cell || <span className="text-muted-foreground">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TableRendererPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={sortedData.length}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      />
    </div>
  )
}
