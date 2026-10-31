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

    // Resposta em linguagem natural visível de imediato
    expect(screen.getByText(/O faturamento total no período foi de/i)).toBeInTheDocument()
    expect(screen.getByText('R$ 42.500.000,00')).toBeInTheDocument()

    // Bloco de auditoria principal recolhido inicialmente
    const auditToggle = screen.getByRole('button', { name: /Alternar exibição da auditoria técnica da IA/i })
    expect(auditToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Ver raciocínio da IA (Auditoria)')).toBeInTheDocument()

    // Ao expandir a auditoria
    fireEvent.click(auditToggle)
    expect(auditToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText('(clique para recolher)').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Consultando base de dados da distribuidora')).toBeInTheDocument()
    expect(screen.getByText('Raciocínio do Agente')).toBeInTheDocument()
    expect(screen.getByText('Consulta SQL')).toBeInTheDocument()
  })

  it('deve exibir indicador executivo amigável durante o streaming inicial sem texto', () => {
    const streamingMessage: ChatMessageType = {
      id: 'msg-2',
      role: MESSAGE_ROLE.ASSISTANT,
      content: '',
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

    expect(screen.getByText('Consultando registros da distribuidora...')).toBeInTheDocument()
    expect(screen.getByText('Ver raciocínio da IA (Auditoria)')).toBeInTheDocument()
  })

  it('deve renderizar mensagem do usuário com comando em destaque quando aplicável', () => {
    const userMessage: ChatMessageType = {
      id: 'msg-3',
      role: MESSAGE_ROLE.USER,
      content: '/sql Qual o consumo residencial?'
    }

    render(<ChatMessage message={userMessage} />)
    expect(screen.getByText('/sql')).toBeInTheDocument()
    expect(screen.getByText('Qual o consumo residencial?')).toBeInTheDocument()
  })
})
