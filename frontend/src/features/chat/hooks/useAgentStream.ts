import { useCallback, useRef, useState } from 'react'
import {
  applyStreamError,
  buildStreamHeaders,
  createTurnMessages,
  parseSessionThreadId
} from '@/features/chat/hooks/streamUtils'
import { handleSseEvent } from '@/features/chat/lib/chatMessageReducer'
import { parseSseStream } from '@/features/chat/lib/sseStreamParser'
import type { ChatMessage } from '@/features/chat/types/chat.types'

/**
 * Hook headless responsável pelo gerenciamento de streaming do chat analítico.
 *
 * @returns Estado das mensagens, status de streaming e funções de controle.
 */
export function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const threadIdRef = useRef<string | null>(null)

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setMessages(prev =>
      prev.map(msg => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    )
  }, [])

  const processStreamEvents = useCallback(
    async (response: Response, assistantId: string, signal: AbortSignal) => {
      for await (const sseEvent of parseSseStream(response, signal)) {
        if (sseEvent.event === 'session') {
          threadIdRef.current = parseSessionThreadId(sseEvent.data) ?? threadIdRef.current
          continue
        }
        if (sseEvent.event === 'done') {
          setMessages(prev =>
            prev.map(msg => (msg.id === assistantId ? { ...msg, isStreaming: false } : msg))
          )
          break
        }
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId ? handleSseEvent(msg, sseEvent.event, sseEvent.data) : msg
          )
        )
      }
    },
    []
  )

  const sendMessage = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim()
      if (!trimmed || isStreaming) return

      stopStreaming()
      const { userMessage, assistantMessage } = createTurnMessages(trimmed)
      setMessages(prev => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        // O streaming SSE utiliza fetch direto (em vez de useQuery do TanStack Query)
        // para permitir o consumo bidirecional de eventos incrementais em tempo real.
        const response = await fetch('/api/v1/chat/stream', {
          method: 'POST',
          headers: buildStreamHeaders(),
          body: JSON.stringify({ pergunta: trimmed, thread_id: threadIdRef.current }),
          signal: abortController.signal
        })

        if (!response.ok) {
          throw new Error(`Falha no servidor: ${String(response.status)}`)
        }

        await processStreamEvents(response, assistantMessage.id, abortController.signal)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setMessages(prev => applyStreamError(prev, assistantMessage.id, err))
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsStreaming(false)
          abortControllerRef.current = null
        }
      }
    },
    [isStreaming, processStreamEvents, stopStreaming]
  )

  const clearMessages = useCallback(() => {
    stopStreaming()
    threadIdRef.current = null
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
