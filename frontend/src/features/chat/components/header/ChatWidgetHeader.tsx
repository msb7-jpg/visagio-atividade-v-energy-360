import { Bot, GripHorizontal, Maximize2, Minimize2, Trash2, X } from 'lucide-react'
import type { JSX, PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Propriedades do cabeçalho de controle do widget de chat.
 */
export interface ChatWidgetHeaderProps {
  /** Indica se há transmissão de streaming ativa. */
  isStreaming: boolean
  /** Indica se o chat está expandido em modo de tela cheia. */
  isFullscreen: boolean
  /** Indica se há mensagens para permitir limpeza. */
  hasMessages: boolean
  /** Handler para iniciar o arraste nativo pelo motion dragControls. */
  onPointerDownDrag?: (event: ReactPointerEvent) => void
  /** Callback para alternância de tela cheia. */
  onToggleFullscreen: () => void
  /** Callback para limpeza de mensagens. */
  onClear: () => void
  /** Callback para fechamento do widget. */
  onClose: () => void
}

/**
 * Cabeçalho do painel de chat com área de arraste, status e ações.
 *
 * @param props - Propriedades de controle e callbacks.
 * @returns Elemento JSX com a barra superior de controle.
 */
export function ChatWidgetHeader({
  isStreaming,
  isFullscreen,
  hasMessages,
  onPointerDownDrag,
  onToggleFullscreen,
  onClear,
  onClose
}: ChatWidgetHeaderProps): JSX.Element {
  return (
    <div
      onPointerDown={event => {
        const target = event.target as HTMLElement
        if (target.closest('button') || target.closest('input') || target.closest('a')) {
          return
        }
        onPointerDownDrag?.(event)
      }}
      className={`flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md ${
        isFullscreen ? '' : 'cursor-grab active:cursor-grabbing select-none'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {!isFullscreen ? (
          <GripHorizontal className="size-4 text-muted-foreground/60 transition-colors hover:text-foreground" />
        ) : null}
        <div className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
          <Bot className="size-4" />
          {isStreaming ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          ) : null}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm tracking-tight">
            Assistente V-Energy IA
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasMessages ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isStreaming}
            aria-label="Limpar histórico"
            title="Limpar histórico"
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Reduzir para janela flutuante' : 'Expandir para tela cheia'}
          title={isFullscreen ? 'Reduzir para janela' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="size-4 text-muted-foreground" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Fechar assistente"
          title="Fechar assistente"
        >
          <X className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
