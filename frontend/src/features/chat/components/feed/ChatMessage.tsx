import { User } from 'lucide-react'
import type { JSX } from 'react'
import { AgentAvatar } from '@/features/chat/components/feed/AgentAvatar'
import { ChatErrorCard } from '@/features/chat/components/feed/ChatErrorCard'
import { ChatMessageActions } from '@/features/chat/components/feed/ChatMessageActions'
import { CommandBadge } from '@/features/chat/components/feed/CommandBadge'
import { NodeStepper } from '@/features/chat/components/feed/NodeStepper'
import { MarkdownRenderer } from '@/features/chat/components/renderers/MarkdownRenderer'
import { SqlCodeBlock } from '@/features/chat/components/renderers/SqlCodeBlock'
import { ThoughtInspector } from '@/features/chat/components/renderers/ThoughtInspector'
import { MESSAGE_ROLE, type ChatMessage as ChatMessageType } from '@/features/chat/types/chat.types'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização de uma mensagem de conversa individual no feed.
 */
export interface ChatMessageProps {
  /** Objeto consolidado da mensagem com etapas e metadados. */
  message: ChatMessageType
  /** Callback para nova tentativa de envio. */
  onRetry?: () => void
  /** Indica se o streaming está ativo para desabilitar ações. */
  isStreaming?: boolean
  /** Classes CSS adicionais. */
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

interface MessageArtifactsProps {
  thought?: string | null
  sql?: string | null
  error?: string | null
  onRetry?: () => void
}

function MessageArtifacts({ thought, sql, error, onRetry }: MessageArtifactsProps): JSX.Element {
  return (
    <>
      {thought ? <ThoughtInspector thought={thought} /> : null}
      {sql ? <SqlCodeBlock query={sql} /> : null}
      {error ? <ChatErrorCard message={error} onRetry={onRetry} /> : null}
    </>
  )
}

function AssistantMessageBody({
  message,
  onRetry,
  isStreaming = false
}: AssistantMessageBodyProps): JSX.Element {
  const hasSteps = Boolean(message.steps?.length || message.isStreaming)
  const showActions = !message.isStreaming && Boolean(message.content || message.error)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {hasSteps ? (
        <NodeStepper steps={message.steps ?? []} isStreaming={message.isStreaming} />
      ) : null}
      <MessageArtifacts
        thought={message.thought}
        sql={message.sql}
        error={message.error}
        onRetry={onRetry}
      />
      {message.content ? <MarkdownRenderer content={message.content} /> : null}
      {showActions ? (
        <ChatMessageActions
          content={message.content}
          onRetry={onRetry}
          isStreaming={isStreaming}
        />
      ) : null}
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
 *
 * @param props - Propriedades de configuração da mensagem e callbacks de ação.
 * @returns Elemento JSX formatado para usuário ou assistente.
 */
export function ChatMessage(props: ChatMessageProps): JSX.Element {
  if (props.message.role === MESSAGE_ROLE.USER) {
    return <UserChatMessage message={props.message} className={props.className} />
  }

  return <AssistantChatMessage {...props} />
}
