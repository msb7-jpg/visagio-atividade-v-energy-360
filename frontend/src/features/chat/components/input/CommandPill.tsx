import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Propriedades do indicador de comando de barra ativo.
 */
export interface CommandPillProps {
  /** Nome identificador do comando (ex: /chart). */
  command: string
  /** Callback acionado ao remover o comando ativo. */
  onRemove: () => void
}

/**
 * Tag visual indicando o comando de barra prefixado atualmente no input.
 *
 * @param props - Propriedades de comando e remoção.
 * @returns Elemento JSX da pill com botão de fechar.
 */
export function CommandPill({ command, onRemove }: CommandPillProps) {
  return (
    <div
      data-testid="input-command-pill"
      className="inline-flex shrink-0 select-none items-center gap-1.5 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 font-mono text-xs font-semibold text-primary shadow-xs"
    >
      <span>{command}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remover comando ${command}`}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}
