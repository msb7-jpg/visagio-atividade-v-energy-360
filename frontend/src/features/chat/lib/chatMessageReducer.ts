import {
  STEP_STATUS,
  type AgentStepItem,
  type ChatMessage
} from '@/features/chat/types/chat.types'

/**
 * Atualiza ou insere uma etapa de execução do agente na lista.
 *
 * @param steps - Lista de etapas já existentes.
 * @param newStep - Nova etapa a ser adicionada ou atualizada.
 * @returns Lista de etapas atualizada.
 */
export function updateAgentStep(
  steps: AgentStepItem[] = [],
  newStep: AgentStepItem
): AgentStepItem[] {
  const filtered = steps.filter(item => item.step !== newStep.step)
  return [...filtered, newStep]
}

type PayloadMap = Record<string, unknown>

function handleStepEndEvent(currentMessage: ChatMessage, payload: PayloadMap): ChatMessage {
  const stepItem: AgentStepItem = {
    step: String(payload.step || ''),
    label: String(payload.label || ''),
    status: (payload.status as AgentStepItem['status']) || STEP_STATUS.ACTIVE,
    duration_ms: typeof payload.duration_ms === 'number' ? payload.duration_ms : undefined
  }
  return {
    ...currentMessage,
    steps: updateAgentStep(currentMessage.steps, stepItem)
  }
}

function handleThoughtEvent(currentMessage: ChatMessage, payload: PayloadMap): ChatMessage {
  const thoughtText = String(payload.thought || '')
  const existing = currentMessage.thought || ''
  const updated = existing ? `${existing}\n\n${thoughtText}` : thoughtText
  return { ...currentMessage, thought: updated }
}

function handleSqlEvent(currentMessage: ChatMessage, payload: PayloadMap): ChatMessage {
  return {
    ...currentMessage,
    sql: String(payload.sql || ''),
    duration_ms: typeof payload.execution_time_ms === 'number' ? payload.execution_time_ms : currentMessage.duration_ms
  }
}

function resolveRowCount(payload: PayloadMap, rows: Record<string, unknown>[] | null): number | undefined {
  if (typeof payload.total === 'number') {
    return payload.total
  }
  if (Array.isArray(rows)) {
    return rows.length
  }
  return undefined
}

function handleDataEvent(currentMessage: ChatMessage, payload: PayloadMap): ChatMessage {
  const rows = (payload.results || payload.data || null) as Record<string, unknown>[] | null
  const totalRows = resolveRowCount(payload, rows)
  return {
    ...currentMessage,
    data: rows,
    row_count: totalRows
  }
}

function handleErrorEvent(currentMessage: ChatMessage, payload: PayloadMap): ChatMessage {
  const errorText = String(payload.message || payload.error || 'Erro na execução')
  const failedSteps = (currentMessage.steps || []).map(stepItem => ({
    ...stepItem,
    status: STEP_STATUS.ERROR
  }))
  return {
    ...currentMessage,
    error: errorText,
    steps: failedSteps
  }
}

const EVENT_HANDLERS: Record<string, (msg: ChatMessage, payload: PayloadMap) => ChatMessage> = {
  step_end: handleStepEndEvent,
  thought: handleThoughtEvent,
  sql: handleSqlEvent,
  data: handleDataEvent,
  token: (msg, payload) => ({ ...msg, content: msg.content + String(payload.token || payload.text || '') }),
  answer: (msg, payload) => ({ ...msg, content: String(payload.answer || payload.content || '') }),
  error: handleErrorEvent
}

/**
 * Aplica um evento SSE sobre o estado da mensagem do assistente.
 *
 * @param currentMessage - Mensagem corrente sendo atualizada.
 * @param eventType - Tipo de evento emitido pelo SSE.
 * @param rawPayload - Conteúdo bruto em JSON do evento.
 * @returns Nova mensagem atualizada.
 */
export function handleSseEvent(
  currentMessage: ChatMessage,
  eventType: string,
  rawPayload: string
): ChatMessage {
  try {
    const payload = JSON.parse(rawPayload) as PayloadMap
    const handler = EVENT_HANDLERS[eventType]
    return handler ? handler(currentMessage, payload) : currentMessage
  } catch {
    return currentMessage
  }
}
