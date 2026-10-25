import { describe, expect, it } from 'vitest'
import { handleSseEvent, updateAgentStep } from './chatMessageReducer'
import { MESSAGE_ROLE, STEP_STATUS, type AgentStepItem, type ChatMessage } from '../types/chat.types'

describe('chatMessageReducer', () => {
  const baseMessage: ChatMessage = {
    id: 'asst-1',
    role: MESSAGE_ROLE.ASSISTANT,
    content: '',
    steps: [],
    timestamp: '2026-10-20T18:00:00Z'
  }

  it('deve atualizar ou anexar etapas sem duplicar pelo identificador de nó', () => {
    const step1: AgentStepItem = {
      step: 'router',
      label: 'Classificando',
      status: STEP_STATUS.ACTIVE
    }
    const initialSteps = updateAgentStep([], step1)
    expect(initialSteps).toHaveLength(1)

    const step1Updated: AgentStepItem = {
      step: 'router',
      label: 'Classificando',
      status: STEP_STATUS.DONE,
      duration_ms: 45
    }
    const nextSteps = updateAgentStep(initialSteps, step1Updated)
    expect(nextSteps).toHaveLength(1)
    expect(nextSteps[0].status).toBe(STEP_STATUS.DONE)
    expect(nextSteps[0].duration_ms).toBe(45)
  })

  it('deve processar evento step_end', () => {
    const payload = JSON.stringify({
      step: 'sql_generator',
      label: 'Gerando SQL',
      status: 'done',
      duration_ms: 120
    })

    const updated = handleSseEvent(baseMessage, 'step_end', payload)
    expect(updated.steps).toHaveLength(1)
    expect(updated.steps?.[0].step).toBe('sql_generator')
    expect(updated.steps?.[0].status).toBe('done')
  })

  it('deve processar evento thought incrementalmente', () => {
    const payload1 = JSON.stringify({ thought: 'Identificando tabelas' })
    const msg1 = handleSseEvent(baseMessage, 'thought', payload1)
    expect(msg1.thought).toBe('Identificando tabelas')

    const payload2 = JSON.stringify({ thought: 'Aplicando filtros de data' })
    const msg2 = handleSseEvent(msg1, 'thought', payload2)
    expect(msg2.thought).toBe('Identificando tabelas\n\nAplicando filtros de data')
  })

  it('deve processar evento sql com telemetria', () => {
    const payload = JSON.stringify({
      sql: 'SELECT * FROM fato_faturamento LIMIT 10;',
      execution_time_ms: 85
    })
    const updated = handleSseEvent(baseMessage, 'sql', payload)
    expect(updated.sql).toBe('SELECT * FROM fato_faturamento LIMIT 10;')
    expect(updated.duration_ms).toBe(85)
  })

  it('deve processar evento answer e token', () => {
    const tokenPayload = JSON.stringify({ token: 'Olá ' })
    const tokenMsg = handleSseEvent(baseMessage, 'token', tokenPayload)
    expect(tokenMsg.content).toBe('Olá ')

    const answerPayload = JSON.stringify({ answer: 'Resposta final completa' })
    const answerMsg = handleSseEvent(tokenMsg, 'answer', answerPayload)
    expect(answerMsg.content).toBe('Resposta final completa')
  })

  it('deve tratar evento de erro marcando etapas com falha', () => {
    const msgWithSteps: ChatMessage = {
      ...baseMessage,
      steps: [
        { step: 'router', label: 'Router', status: STEP_STATUS.DONE },
        { step: 'sql_validator', label: 'Validador', status: STEP_STATUS.ACTIVE }
      ]
    }
    const errorPayload = JSON.stringify({
      error: 'SECURITY_VIOLATION',
      message: 'Comando DROP não permitido'
    })
    const updated = handleSseEvent(msgWithSteps, 'error', errorPayload)
    expect(updated.error).toBe('Comando DROP não permitido')
    expect(updated.steps?.every(stepItem => stepItem.status === STEP_STATUS.ERROR)).toBe(true)
  })

  it('deve processar evento chart aninhado e evento data com contagem de registros', () => {
    const chartPayload = JSON.stringify({
      chart: {
        type: 'bar',
        title: 'Consumo por Classe',
        labels: ['B1', 'B3'],
        datasets: [{ label: 'kWh', data: [1200, 3400] }]
      }
    })
    const withChart = handleSseEvent(baseMessage, 'chart', chartPayload)
    expect(withChart.chart?.title).toBe('Consumo por Classe')
    expect(withChart.chart?.chart_type).toBe('bar')
    expect(withChart.chart?.data.labels).toEqual(['B1', 'B3'])

    const dataPayload = JSON.stringify({
      results: [{ classe: 'B1', kwh: 1200 }],
      total: 14
    })
    const withData = handleSseEvent(withChart, 'data', dataPayload)
    expect(withData.row_count).toBe(14)
    expect(withData.data).toHaveLength(1)
  })
})
