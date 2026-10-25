import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import type { SlashCommandItem } from '@/features/chat/components/input/useSlashCommandsController'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização do menu popover de comandos de barra.
 */
export interface SlashCommandMenuProps {
  /** Lista de comandos filtrados para exibição. */
  commands: SlashCommandItem[]
  /** Índice do comando selecionado para navegação via teclado. */
  selectedIndex: number
  /** Callback para registro do elemento de botão do menu para rolagem automática. */
  onRegisterItemRef: (index: number, element: HTMLDivElement | null) => void
  /** Callback acionado ao selecionar um comando. */
  onSelectCommand: (commandName: string) => void
  /** Callback acionado ao posicionar o cursor sobre um item. */
  onHoverIndex: (index: number) => void
}

/**
 * Menu suspenso com a lista de comandos de barra com navegação por setas e Enter.
 *
 * @param props - Propriedades de comandos, seleção e callbacks.
 * @returns Elemento JSX do menu flutuante.
 */
export function SlashCommandMenu({
  commands,
  selectedIndex,
  onRegisterItemRef,
  onSelectCommand,
  onHoverIndex
}: SlashCommandMenuProps): JSX.Element {
  return (
    <div
      data-testid="slash-command-menu"
      className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border border-border bg-card/95 p-1 shadow-2xl backdrop-blur-xl sm:w-80"
    >
      <div className="border-b border-border px-2 py-1.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
        Comandos Rápidos
      </div>
      <div className="max-h-56 space-y-0.5 overflow-y-auto py-1">
        {commands.map((cmd, idx) => {
          const Icon = cmd.icon
          const isSelected = idx === selectedIndex
          return (
            <div
              key={cmd.name}
              ref={element => {
                onRegisterItemRef(idx, element)
              }}
              className="w-full"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => onSelectCommand(cmd.name)}
                onMouseEnter={() => onHoverIndex(idx)}
              >
                <span className="flex w-full items-center gap-2 text-left">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-md border',
                      isSelected
                        ? 'border-primary/30 bg-primary/20 text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono font-semibold text-xs">{cmd.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{cmd.description}</span>
                  </span>
                </span>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
