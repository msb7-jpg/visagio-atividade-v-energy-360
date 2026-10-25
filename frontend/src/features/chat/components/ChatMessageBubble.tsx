// fallow-ignore-file unused-file
import type { JSX } from 'react'
import { ChatMessage } from '@/features/chat/components/feed/ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/features/chat/types/chat.types'

/**
 * Propriedades para o balão de mensagem legado.
 */
export interface ChatMessageBubbleProps {
  /** Objeto de mensagem a ser renderizado. */
  message: ChatMessageType
}

/**
 * Renderiza um turno de mensagem utilizando o componente moderno ChatMessage.
 *
 * @param props - Propriedades contendo o objeto de mensagem.
 * @returns Elemento JSX do balão de conversa.
 */
export function ChatMessageBubble({ message }: ChatMessageBubbleProps): JSX.Element {
  return <ChatMessage message={message} />
}
