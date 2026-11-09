import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatMessage } from '@/features/chat/components/feed/ChatMessage'
import { MESSAGE_ROLE, STEP_STATUS, type ChatMessage as ChatMessageType } from '@/features/chat/types/chat.types'

describe('ChatMessage', () => {
  it('deve priorizar a resposta em linguagem natural e manter a auditoria técnica recolhida', () => {
    const assistantMessage: ChatMessageType = {
      id: 'msg-1',
      role: MESSAGE_ROLE.ASSISTANT,
      content: 'O faturamento total no período foi de **R$ 42.500.000,00**.',
      timestamp: '2026-10-31T17:00:00.000Z',
      steps: [
        {
          step: 'sql_executor',
          label: 'Consultando base de dados da distribuidora',
          status: STEP_STATUS.DONE,
          duration_ms: 120
        }
      ],
      thought: 'Calculando a soma de valor_total_rs na tabela fato_faturamento.',
      sql: 'SELECT sum(valor_total_rs) FROM fato_faturamento;'
    }

    render(<ChatMessage message={assistantMessage} />)

    expect(screen.getByText(/O faturamento total no período foi de/i)).toBeInTheDocument()
    expect(screen.getByText('R$ 42.500.000,00')).toBeInTheDocument()

    const auditToggle = screen.getByRole('button', { name: /Alternar exibição da auditoria técnica da IA/i })
    expect(auditToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Ver raciocínio da IA (Auditoria)')).toBeInTheDocument()

    fireEvent.click(auditToggle)
    expect(auditToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText('(clique para recolher)').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Consultando base de dados da distribuidora')).toBeInTheDocument()
    expect(screen.getByText('Raciocínio do Agente')).toBeInTheDocument()
    expect(screen.getByText('Consulta SQL')).toBeInTheDocument()
  })

  it('deve renderizar grifos embutidos ==texto== naturalmente na resposta e abas para múltiplas consultas SQL', () => {
    const multiQueryAssistantMessage: ChatMessageType = {
      id: 'msg-multi',
      role: MESSAGE_ROLE.ASSISTANT,
      content: [
        '## Análise do Impacto da Tarifação e do Volume',
        '',
        'A receita subiu ==+8,0%== sustentada pelo ==efeito-preço de R$ 19,6M==, enquanto a retração de volume concentrou-se nas UCs com GD.'
      ].join('\n'),
      timestamp: '2026-10-31T17:05:00.000Z',
      sql: [
        '-- [CONSULTA 1: Decomposicao Receita]',
        'SELECT SUM(valor_total_rs) FROM fato_faturamento;',
        '-- [CONSULTA 2: Impacto GD Solar]',
        'SELECT possui_gd, COUNT(*) FROM dim_unidade_consumidora GROUP BY possui_gd;'
      ].join('\n')
    }

    render(<ChatMessage message={multiQueryAssistantMessage} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Análise do Impacto da Tarifação e do Volume' })).toBeInTheDocument()
    const highlightedMetric = screen.getByText('+8,0%')
    expect(highlightedMetric.tagName).toBe('MARK')
    expect(screen.getByText('efeito-preço de R$ 19,6M').tagName).toBe('MARK')
    expect(screen.getByText('2 consultas SQL')).toBeInTheDocument()

    const auditToggle = screen.getByRole('button', { name: /Alternar exibição da auditoria técnica da IA/i })
    fireEvent.click(auditToggle)

    const sqlToggle = screen.getByRole('button', { name: /Alternar exibição da consulta SQL/i })
    fireEvent.click(sqlToggle)

    expect(screen.getByRole('tab', { name: '1. Decomposicao Receita' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '2. Impacto GD Solar' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Todas \(2\)/i })).toBeInTheDocument()
  })

  it('deve exibir indicador executivo com o rótulo dinâmico da etapa ativa durante o streaming inicial sem texto', () => {
    const streamingMessage: ChatMessageType = {
      id: 'msg-2',
      role: MESSAGE_ROLE.ASSISTANT,
      content: '',
      timestamp: '2026-10-31T17:01:00.000Z',
      isStreaming: true,
      steps: [
        {
          step: 'sql_generator',
          label: 'Localizando indicadores no sistema',
          status: STEP_STATUS.ACTIVE
        }
      ]
    }

    render(<ChatMessage message={streamingMessage} isStreaming />)

    expect(screen.getAllByText('Localizando indicadores no sistema').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Ver raciocínio da IA (Auditoria)')).toBeInTheDocument()
  })

  it('deve renderizar mensagem do usuário com comando em destaque quando aplicável', () => {
    const userMessage: ChatMessageType = {
      id: 'msg-3',
      role: MESSAGE_ROLE.USER,
      content: '/sql Qual o consumo residencial?',
      timestamp: '2026-10-31T17:02:00.000Z'
    }

    render(<ChatMessage message={userMessage} />)
    expect(screen.getByText('/sql')).toBeInTheDocument()
    expect(screen.getByText('Qual o consumo residencial?')).toBeInTheDocument()
  })
})
