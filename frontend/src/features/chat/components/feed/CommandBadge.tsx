import type { JSX } from 'react'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização do CommandBadge.
 */
export interface CommandBadgeProps {
  /** Nome ou token do comando (ex: '/sql', '/explain'). */
  command: string
  /** Argumentos complementares opcionais após o comando. */
  args?: string
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Renderiza um badge estilizado para identificar comandos de barra executados pelo usuário.
 *
 * @param props - Propriedades com nome do comando e argumentos.
 * @returns Elemento JSX do badge do comando.
 */
export function CommandBadge({ command, args, className }: CommandBadgeProps): JSX.Element {
  const normalizedCommand = command.startsWith('/') ? command : `/${command}`

  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-1.5 rounded-full border border-primary/40 bg-card px-2.5 py-0.5 font-mono text-xs font-medium text-foreground shadow-xs',
        className
      )}
    >
      <span className="font-semibold text-primary">{normalizedCommand}</span>
      {args ? <span className="font-normal text-muted-foreground">{args}</span> : null}
    </span>
  )
}
