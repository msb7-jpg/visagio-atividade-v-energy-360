import { Loader2, User } from 'lucide-react'
import type { JSX } from 'react'
import { AgentAvatar } from '@/features/chat/components/feed/AgentAvatar'
import { AiAuditBlock } from '@/features/chat/components/feed/AiAuditBlock'
import { ChatErrorCard } from '@/features/chat/components/feed/ChatErrorCard'
import { ChatMessageActions } from '@/features/chat/components/feed/ChatMessageActions'
import { CommandBadge } from '@/features/chat/components/feed/CommandBadge'
import { MarkdownRenderer } from '@/features/chat/components/renderers/MarkdownRenderer'
import { MESSAGE_ROLE, type ChatMessage as ChatMessageType } from '@/features/chat/types/chat.types'
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

function UserChatMessage({ message, className }: { message: ChatMessageType; className?: string }) {
  const rawContent = message.content.trim()
  const { command, args } = parseUserContent(rawContent)

  return (
    <div className={cn('flex justify-end gap-3', className)}>
      <div className="max-w-xl rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground shadow-sm">
        {command ? (
          <div className="flex flex-col items-start gap-1.5">
            <CommandBadge command={command} />
            {args ? <span>{args}</span> : null}
          </div>
        ) : (
          message.content
        )}
      </div>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        <User className="size-4" />
      </div>
    </div>
  )
}

interface AssistantMessageBodyProps {
  message: ChatMessageType
  onRetry?: () => void
  isStreaming?: boolean
}

function AssistantMessageBody({
  message,
  onRetry,
  isStreaming = false
}: AssistantMessageBodyProps): JSX.Element {
  const showActions = !message.isStreaming && Boolean(message.content || message.error)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {message.error ? <ChatErrorCard message={message.error} onRetry={onRetry} /> : null}

      {message.isStreaming && !message.content ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Consultando registros da distribuidora...</span>
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

function AssistantChatMessage({
  message,
  onRetry,
  isStreaming = false,
  className
}: ChatMessageProps): JSX.Element {
  return (
    <div className={cn('flex items-start gap-3.5', className)}>
      <AgentAvatar isStreaming={message.isStreaming} />
      <AssistantMessageBody
        message={message}
        onRetry={onRetry}
        isStreaming={isStreaming}
      />
    </div>
  )
}

/**
 * Componente que renderiza um turno de conversa (usuário ou assistente IA).
 */
export function ChatMessage(props: ChatMessageProps): JSX.Element {
  if (props.message.role === MESSAGE_ROLE.USER) {
    return <UserChatMessage message={props.message} className={props.className} />
  }

  return <AssistantChatMessage {...props} />
}
