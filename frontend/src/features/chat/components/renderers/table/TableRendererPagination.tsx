import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableRendererPaginationProps {
  currentPage: number
  totalPages: number
  totalRows: number
  onPrevPage: () => void
  onNextPage: () => void
}

/**
 * Barra inferior de paginação com contador e botões de navegação.
 *
 * @param props - Propriedades de paginação.
 * @returns Elemento JSX com controles de página.
 */
export function TableRendererPagination({
  currentPage,
  totalPages,
  totalRows,
  onPrevPage,
  onNextPage
}: TableRendererPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border bg-card/60 px-4 py-2 text-xs text-muted-foreground">
      <span>
        Página {currentPage} de {totalPages} ({totalRows} registros)
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={currentPage <= 1}
          onClick={onPrevPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={onNextPage}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
