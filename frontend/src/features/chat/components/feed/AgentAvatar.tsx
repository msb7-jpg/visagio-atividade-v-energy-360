import { Bot } from 'lucide-react'
import type { JSX } from 'react'
import { cn } from '@/lib/utils'

/**
 * Propriedades para o avatar do agente assistente.
 */
export interface AgentAvatarProps {
  /**
   * Indica se o modelo está gerando dados ativamente em streaming.
   * @defaultValue `false`
   */
  isStreaming?: boolean
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Avatar visual do agente analítico exibindo pulso luminoso durante transmissões em streaming.
 *
 * @param props - Propriedades de configuração do avatar.
 * @returns Elemento JSX do avatar com ícone de robô e indicador de atividade.
 */
export function AgentAvatar({ isStreaming = false, className }: AgentAvatarProps): JSX.Element {
  return (
    <div
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-b from-card to-secondary shadow-sm',
        isStreaming ? 'border-primary/50 shadow-sm shadow-primary/25' : null,
        className
      )}
    >
      <Bot className={cn('size-4 text-muted-foreground', isStreaming ? 'text-primary' : null)} />
      {isStreaming ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
      ) : null}
    </div>
  )
}
