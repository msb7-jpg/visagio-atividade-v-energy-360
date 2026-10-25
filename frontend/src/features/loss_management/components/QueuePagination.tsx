import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueuePaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

/**
 * Navegação entre páginas da fila priorizada.
 *
 * @param props - Página atual (base 0), total de páginas e callback de troca.
 * @returns Botões anterior/próxima com indicador "Página X de Y".
 */
export function QueuePagination({ page, pageCount, onPageChange }: QueuePaginationProps) {
  return (
    <nav aria-label="Paginação da fila" className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Página anterior"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      <span className="text-muted-foreground text-xs">
        Página {page + 1} de {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Próxima página"
        disabled={page >= pageCount - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
