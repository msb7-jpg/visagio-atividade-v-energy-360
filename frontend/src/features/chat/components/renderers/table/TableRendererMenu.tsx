import { Check, Copy, Download, MoreHorizontal } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'

interface TableRendererMenuProps {
  menuRef: RefObject<HTMLDivElement | null>
  isMenuOpen: boolean
  isCopied: boolean
  onToggleMenu: () => void
  onCopy: () => void
  onExportCsv: () => void
}

/**
 * Menu contextual flutuante de ações da tabela (Copiar TSV e Exportar CSV).
 *
 * @param props - Propriedades de controle e callbacks.
 * @returns Elemento JSX do menu de opções.
 */
export function TableRendererMenu({
  menuRef,
  isMenuOpen,
  isCopied,
  onToggleMenu,
  onCopy,
  onExportCsv
}: TableRendererMenuProps) {
  return (
    <div ref={menuRef} className="absolute top-2.5 right-2 z-20">
      <div className="opacity-70 transition-opacity hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Opções da tabela"
          onClick={onToggleMenu}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      {isMenuOpen ? (
        <div className="absolute right-0 mt-1 min-w-40 space-y-1 rounded-xl border border-border bg-card p-1 shadow-2xl backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onCopy}
          >
            <span className="flex w-full items-center gap-2 text-xs">
              {isCopied ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span className="text-success">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Copiar tabela</span>
                </>
              )}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onExportCsv}
          >
            <span className="flex w-full items-center gap-2 text-xs">
              <Download className="size-3.5 text-muted-foreground" />
              <span>Exportar CSV</span>
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
