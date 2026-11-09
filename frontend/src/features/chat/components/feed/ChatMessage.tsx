import { Loader2, User } from 'lucide-react'
import type { JSX } from 'react'
import { AgentAvatar } from '@/features/chat/components/feed/AgentAvatar'
import { AiAuditBlock } from '@/features/chat/components/feed/AiAuditBlock'
import { ChatErrorCard } from '@/features/chat/components/feed/ChatErrorCard'
import { ChatMessageActions } from '@/features/chat/components/feed/ChatMessageActions'
import { CommandBadge } from '@/features/chat/components/feed/CommandBadge'
import { MarkdownRenderer } from '@/features/chat/components/renderers/MarkdownRenderer'
import {
  MESSAGE_ROLE,
  STEP_STATUS,
  type AgentStepItem,
  type ChatMessage as ChatMessageType
} from '@/features/chat/types/chat.types'
import { cn } from '@/lib/utils'

export interface ChatMessageProps {
  message: ChatMessageType
  onRetry?: () => void
  isStreaming?: boolean
  className?: string
}

function parseUserContent(rawContent: string): { command: string | null; args: string | null } {
  if (!rawContent.startsWith('/')) {
    return { command: null, args: null }
  }
  const spaceIdx = rawContent.indexOf(' ')
  if (spaceIdx === -1) {
    return { command: rawContent, args: null }
  }
  return {
    command: rawContent.slice(0, spaceIdx),
    args: rawContent.slice(spaceIdx + 1)
  }
}

function getActiveStreamingLabel(steps?: AgentStepItem[]): string {
  if (!steps || steps.length === 0) {
    return 'Consultando registros da distribuidora...'
  }
  const activeStep = steps.find(step => step.status === STEP_STATUS.ACTIVE)
  return activeStep ? activeStep.label : steps[steps.length - 1].label
}

function UserChatMessage({ message, className }: { message: ChatMessageType; className?: string }) {
  const { command, args } = parseUserContent(message.content.trim())

  return (
    <div className={cn('flex justify-end gap-3', className)}>
      <div className="max-w-xl min-w-0 break-words rounded-lg bg-secondary px-4 py-2.5 text-sm text-foreground">
        {command ? (
          <div className="flex flex-col items-start gap-1.5">
            <CommandBadge command={command} />
            {args ? <span className="break-words">{args}</span> : null}
          </div>
        ) : (
          message.content
        )}
      </div>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        <User className="size-4" />
      </div>
    </div>
  )
}

function shouldShowMessageActions(message: ChatMessageType): boolean {
  if (message.isStreaming) {
    return false
  }
  return Boolean(message.content) || Boolean(message.error)
}

function AssistantMessageBody({
  message,
  onRetry,
  isStreaming = false
}: ChatMessageProps): JSX.Element {
  const showActions = shouldShowMessageActions(message)
  const showStreamingBanner = Boolean(message.isStreaming) && !message.content

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {message.error ? <ChatErrorCard message={message.error} onRetry={onRetry} /> : null}

      {showStreamingBanner ? (
        <div className="flex items-center gap-2 rounded-lg border border-brand/50 bg-brand/15 px-3 py-2 text-xs text-foreground shadow-xs">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-foreground" />
          <span className="font-medium">{getActiveStreamingLabel(message.steps)}</span>
        </div>
      ) : null}

      {message.content ? <MarkdownRenderer content={message.content} /> : null}

      {showActions ? (
        <ChatMessageActions
          content={message.content}
          onRetry={onRetry}
          isStreaming={isStreaming}
        />
      ) : null}

      <AiAuditBlock
        steps={message.steps ?? []}
        thought={message.thought}
        sql={message.sql}
        isStreaming={message.isStreaming}
      />
    </div>
  )
}

/**
 * Componente que renderiza um turno de conversa (usuário ou assistente IA).
 *
 * @param props - Propriedades contendo a mensagem, callback de retry e status de streaming.
 * @returns Elemento JSX da mensagem renderizada.
 */
export function ChatMessage(props: ChatMessageProps): JSX.Element {
  if (props.message.role === MESSAGE_ROLE.USER) {
    return <UserChatMessage message={props.message} className={props.className} />
  }

  return (
    <div className={cn('flex items-start gap-3.5', props.className)}>
      <AgentAvatar isStreaming={props.message.isStreaming} />
      <AssistantMessageBody {...props} />
    </div>
  )
}
