import { describe, expect, it } from 'vitest'
import { parseSseStream } from './sseStreamParser'

describe('sseStreamParser', () => {
  it('deve decodificar chunks de texto SSE com event e data', async () => {
    const streamContent = 'event: step_end\ndata: {"step":"router"}\n\nevent: done\ndata: {}\n\n'
    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(streamContent))
        controller.close()
      }
    })

    const response = new Response(readable)
    const events: { event: string; data: string }[] = []

    for await (const evt of parseSseStream(response)) {
      events.push(evt)
    }

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ event: 'step_end', data: '{"step":"router"}' })
    expect(events[1]).toEqual({ event: 'done', data: '{}' })
  })

  it('deve abortar precocemente quando sinal for acionado', async () => {
    const controller = new AbortController()
    controller.abort()

    const response = new Response(new ReadableStream())
    const events: unknown[] = []

    for await (const evt of parseSseStream(response, controller.signal)) {
      events.push(evt)
    }

    expect(events).toHaveLength(0)
  })
})
