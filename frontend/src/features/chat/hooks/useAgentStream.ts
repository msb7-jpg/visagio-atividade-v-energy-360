import { useCallback, useRef, useState } from 'react'
import { handleSseEvent } from '@/features/chat/lib/chatMessageReducer'
import { parseSseStream } from '@/features/chat/lib/sseStreamParser'
import { MESSAGE_ROLE, type ChatMessage } from '@/features/chat/types/chat.types'

/**
 * Hook headless responsável pelo gerenciamento de streaming do chat analítico.
 *
 * @returns Estado das mensagens, status de streaming e funções de controle.
 */
export function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const sendMessage = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim()
      if (!trimmed || isStreaming) return

      stopStreaming()

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: MESSAGE_ROLE.USER,
        content: trimmed,
        timestamp: new Date().toISOString()
      }

      const assistantMessageId = `asst-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: MESSAGE_ROLE.ASSISTANT,
        content: '',
        steps: [],
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch('/api/v1/agent/chat/stream', {
          method: 'POST',
          headers,
          body: JSON.stringify({ pergunta: trimmed }),
          signal: abortController.signal
        })

        if (!response.ok) {
          throw new Error(`Falha no servidor: ${response.status}`)
        }

        for await (const sseEvent of parseSseStream(response, abortController.signal)) {
          if (sseEvent.event === 'done') {
            break
          }
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? handleSseEvent(msg, sseEvent.event, sseEvent.data)
                : msg
            )
          )
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const errorMsg = err instanceof Error ? err.message : 'Erro ao processar consulta'
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId ? { ...msg, error: errorMsg } : msg
          )
        )
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [isStreaming, stopStreaming]
  )

  const clearMessages = useCallback(() => {
    stopStreaming()
    setMessages([])
  }, [stopStreaming])

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearMessages
  }
}
