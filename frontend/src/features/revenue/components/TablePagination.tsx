import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TablePaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

/**
 * Rodapé de paginação: posição atual, total de linhas e botões anterior/próxima.
 *
 * @param props - Página atual, total de páginas, total de linhas e callback de troca.
 * @returns Barra de paginação.
 */
export function TablePagination({ page, totalPages, total, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">
        Página {page} de {Math.max(totalPages, 1)} · {total} {total === 1 ? 'linha' : 'linhas'}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <span className="flex items-center gap-1">
            <ChevronLeft className="size-3.5" /> Anterior
          </span>
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <span className="flex items-center gap-1">
            Próxima <ChevronRight className="size-3.5" />
          </span>
        </Button>
      </div>
    </div>
  )
}
