import { AgentStepProgress } from '@/features/chat/components/AgentStepProgress'
import { SqlAuditAccordion } from '@/features/chat/components/SqlAuditAccordion'
import { MESSAGE_ROLE, type ChatMessage } from '@/features/chat/types/chat.types'

interface ChatMessageBubbleProps {
  message: ChatMessage
}

/**
 * Renderiza um balão individual de mensagem do usuário ou do assistente IA.
 *
 * @param props - Propriedades contendo o objeto de mensagem.
 * @returns Balão de conversa estilizado corporativamente.
 */
export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === MESSAGE_ROLE.USER

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-md rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col my-2 max-w-lg">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <AgentStepProgress steps={message.steps} />

        {message.thought ? (
          <div className="mb-2 rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground italic border-l-2 border-primary">
            {message.thought}
          </div>
        ) : null}

        {message.content ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </div>
        ) : null}

        {message.error ? (
          <div className="mt-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20 font-medium">
            {message.error}
          </div>
        ) : null}

        <SqlAuditAccordion sql={message.sql} durationMs={message.duration_ms} />
      </div>
    </div>
  )
}
