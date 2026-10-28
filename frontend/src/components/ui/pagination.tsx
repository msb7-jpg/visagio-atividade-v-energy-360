import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Propriedades da paginação compartilhada.
 */
export interface PaginationProps {
  /** Página atual, a partir de 1. */
  page: number
  /** Total de páginas (zero ou um mostra "Página 1 de 1" com os dois botões bloqueados). */
  totalPages: number
  /** Chamado com o número (a partir de 1) da página escolhida. */
  onPageChange: (page: number) => void
  /** Texto de apoio depois de "Página X de Y", ex.: "22 linhas". */
  summary?: string
  /** Nome da navegação para leitores de tela. */
  label?: string
}

/**
 * Navegação entre páginas com botões anterior/próxima e o indicador "Página X de Y".
 * Componente único de paginação do portal: telas de tabela e fila devem usá-lo em vez de criar o seu.
 *
 * @param props - Página atual, total, callback de troca, resumo opcional e nome acessível.
 * @returns Barra de navegação entre páginas.
 */
export function Pagination({ page, totalPages, onPageChange, summary, label = 'Paginação' }: PaginationProps) {
  const lastPage = Math.max(totalPages, 1)
  const position = `Página ${page} de ${lastPage}`
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">{summary ? `${position} · ${summary}` : position}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
