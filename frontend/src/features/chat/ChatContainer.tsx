import { useEffect, useRef, type JSX } from 'react'
import { ChatEmptyWelcome } from '@/features/chat/components/empty-state/ChatEmptyWelcome'
import { ChatMessage } from '@/features/chat/components/feed/ChatMessage'
import { ChatInput } from '@/features/chat/components/input/ChatInput'
import type { ChatMessage as ChatMessageType } from '@/features/chat/types/chat.types'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização do container principal de chat.
 */
export interface ChatContainerProps {
  /** Lista de mensagens ativas da conversa. */
  messages: ChatMessageType[]
  /** Indica se há geração ativa em streaming. */
  isStreaming: boolean
  /** Callback para submissão de mensagens. */
  onSendMessage: (text: string) => void
  /** Callback para cancelamento da transmissão em andamento. */
  onAbortStream: () => void
  /** Callback para limpeza da conversa. */
  onClear: () => void
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Container principal do feed de conversa, orquestrando histórico e novos envios.
 *
 * @param props - Propriedades contendo mensagens, status e callbacks de envio.
 * @returns Elemento JSX do container com feed e campo de texto.
 */
export function ChatContainer({
  messages,
  isStreaming,
  onSendMessage,
  onAbortStream,
  onClear,
  className
}: ChatContainerProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = (text: string) => {
    if (text.trim() === '/clear') {
      onClear()
      return
    }
    onSendMessage(text)
  }

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user')
    if (lastUserMsg) {
      onSendMessage(lastUserMsg.content)
    }
  }

  return (
    <div className={cn('relative flex h-full flex-col bg-background/50', className)}>
      <div
        data-chat-scroll-container
        className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-4xl space-y-5">
          {messages.length === 0 ? (
            <ChatEmptyWelcome isStreaming={isStreaming} onSelectPrompt={handleSend} />
          ) : (
            messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming}
                onRetry={handleRetryLast}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-background/80 p-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            onSendMessage={handleSend}
            onAbortStream={onAbortStream}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
