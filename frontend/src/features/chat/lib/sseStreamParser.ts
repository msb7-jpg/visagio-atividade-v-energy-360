export interface SseEvent {
  event: string
  data: string
}

interface ProcessedLineResult {
  nextEvent: string
  eventToYield?: SseEvent
}

function processSseLine(trimmed: string, currentEvent: string): ProcessedLineResult {
  if (!trimmed) {
    return { nextEvent: 'message' }
  }
  if (trimmed.startsWith('event:')) {
    return { nextEvent: trimmed.slice(6).trim() }
  }
  if (trimmed.startsWith('data:')) {
    return {
      nextEvent: currentEvent,
      eventToYield: { event: currentEvent, data: trimmed.slice(5).trim() }
    }
  }
  return { nextEvent: currentEvent }
}

function extractSseEventsFromBuffer(
  rawBuffer: string,
  decoder: TextDecoder,
  chunk: Uint8Array,
  currentEvent: string
): { remainingBuffer: string; events: SseEvent[]; nextEvent: string } {
  const combined = rawBuffer + decoder.decode(chunk, { stream: true })
  const lines = combined.split('\n')
  const remainingBuffer = lines.pop() ?? ''
  const events: SseEvent[] = []
  let activeEvent = currentEvent

  for (const line of lines) {
    const result = processSseLine(line.trim(), activeEvent)
    activeEvent = result.nextEvent
    if (result.eventToYield) {
      events.push(result.eventToYield)
    }
  }

  return { remainingBuffer, events, nextEvent: activeEvent }
}

function cleanupReader(reader: ReadableStreamDefaultReader<Uint8Array>, isAborted?: boolean): void {
  try {
    if (isAborted) {
      void reader.cancel().catch(() => {})
    }
  } finally {
    reader.releaseLock()
  }
}

interface DrainState {
  buffer: string
  currentEvent: string
}

function processChunk(
  state: DrainState,
  decoder: TextDecoder,
  value: Uint8Array
): { nextState: DrainState; events: SseEvent[] } {
  const extracted = extractSseEventsFromBuffer(state.buffer, decoder, value, state.currentEvent)
  return {
    nextState: {
      buffer: extracted.remainingBuffer,
      currentEvent: extracted.nextEvent
    },
    events: extracted.events
  }
}

async function* emitChunkEvents(
  events: SseEvent[],
  signal?: AbortSignal
): AsyncGenerator<SseEvent, void, unknown> {
  for (let index = 0; index < events.length; index += 1) {
    if (signal?.aborted) return
    yield events[index]
  }
}

async function* drainReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  signal?: AbortSignal
): AsyncGenerator<SseEvent, void, unknown> {
  let state: DrainState = { buffer: '', currentEvent: 'message' }

  while (!signal?.aborted) {
    const readResult = await reader.read()
    if (readResult.done || !readResult.value) break

    const { nextState, events } = processChunk(state, decoder, readResult.value)
    state = nextState
    yield* emitChunkEvents(events, signal)
  }

  const trailing = processSseLine(state.buffer.trim(), state.currentEvent)
  if (!signal?.aborted && trailing.eventToYield) {
    yield trailing.eventToYield
  }
}

/**
 * Lê e decodifica assincronamente eventos SSE a partir de uma resposta HTTP.
 *
 * @param response - Objeto Response do fetch.
 * @param signal - Sinal de cancelamento opcional.
 * @returns Gerador assíncrono emitindo eventos estruturados.
 */
export async function* parseSseStream(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<SseEvent, void, unknown> {
  if (!response.body || signal?.aborted) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  const onAbort = () => {
    void reader.cancel().catch(() => {})
  }

  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    yield* drainReader(reader, decoder, signal)
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort)
    }
    cleanupReader(reader, signal?.aborted)
  }
}
