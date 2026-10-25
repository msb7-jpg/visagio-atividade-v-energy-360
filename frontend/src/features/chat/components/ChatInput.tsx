// fallow-ignore-file unused-file
import type { JSX } from 'react'
import { ChatInput as ModernChatInput } from '@/features/chat/components/input/ChatInput'

/**
 * Propriedades para compatibilidade com o campo de entrada de chat.
 */
export interface ChatInputProps {
  /** Callback legado de envio de mensagem. */
  onSend?: (text: string) => void
  /** Callback moderno de envio de mensagem. */
  onSendMessage?: (text: string) => void
  /** Indicador de bloqueio do campo. */
  disabled?: boolean
  /** Indicador de transmissão em streaming. */
  isStreaming?: boolean
  /** Callback para cancelamento da transmissão. */
  onAbortStream?: () => void
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Adaptador do campo de entrada de texto e envio de comandos do chat analítico.
 *
 * @param props - Propriedades de compatibilidade e callbacks.
 * @returns Elemento JSX do campo de texto com comandos rápidos.
 */
export function ChatInput({
  onSend,
  onSendMessage,
  disabled = false,
  isStreaming = false,
  onAbortStream,
  className
}: ChatInputProps): JSX.Element {
  const handleSend = onSendMessage ?? onSend ?? (() => {})

  return (
    <ModernChatInput
      onSendMessage={handleSend}
      onAbortStream={onAbortStream}
      isStreaming={isStreaming}
      disabled={disabled}
      className={className}
    />
  )
}
