import { getStoredToken } from '@/features/auth/utils/token'
import { MESSAGE_ROLE, type ChatMessage } from '@/features/chat/types/chat.types'

/**
 * Extrai o thread_id do payload JSON de um evento SSE session.
 *
 * @param rawData - String JSON do evento session.
 * @returns O thread_id extraído ou null.
 */
export function parseSessionThreadId(rawData: string): string | null {
  try {
    const parsed = JSON.parse(rawData) as { thread_id?: unknown }
    return typeof parsed.thread_id === 'string' ? parsed.thread_id : null
  } catch {
    return null
  }
}

/**
 * Constrói os cabeçalhos HTTP necessários para o streaming com JWT.
 *
 * @returns Headers configurados para requisição SSE.
 */
export function buildStreamHeaders(): HeadersInit {
  const token = getStoredToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * Cria a estrutura inicial do par de mensagens (usuário e assistente) para um novo turno.
 *
 * @param questionText - Texto enviado pelo usuário.
 * @returns Par de mensagens do turno.
 */
export function createTurnMessages(questionText: string): {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
} {
  const nowIso = new Date().toISOString()
  const nowMs = Date.now()
  return {
    userMessage: {
      id: `user-${String(nowMs)}`,
      role: MESSAGE_ROLE.USER,
      content: questionText,
      timestamp: nowIso
    },
    assistantMessage: {
      id: `asst-${String(nowMs)}`,
      role: MESSAGE_ROLE.ASSISTANT,
      content: '',
      steps: [],
      timestamp: nowIso,
      isStreaming: true
    }
  }
}

/**
 * Aplica uma mensagem de erro na mensagem do assistente.
 *
 * @param messages - Lista atual de mensagens.
 * @param assistantId - ID da mensagem do assistente com falha.
 * @param err - Exceção ou erro capturado.
 * @returns Nova lista de mensagens atualizada.
 */
export function applyStreamError(
  messages: ChatMessage[],
  assistantId: string,
  err: unknown
): ChatMessage[] {
  const errorMsg = err instanceof Error ? err.message : 'Erro ao processar consulta'
  return messages.map(msg =>
    msg.id === assistantId ? { ...msg, error: errorMsg, isStreaming: false } : msg
  )
}
