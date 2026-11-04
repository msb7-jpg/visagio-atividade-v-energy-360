import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatWidgetTrigger } from './ChatWidgetTrigger'

describe('ChatWidgetTrigger', () => {
  it('deve disparar onOpen ao clicar no botão quando não estiver em streaming', () => {
    const handleOpen = vi.fn()
    render(
      <ChatWidgetTrigger
        isStreaming={false}
        positionClass="right-6 bottom-6"
        onOpen={handleOpen}
      />
    )

    const button = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(button)

    expect(handleOpen).toHaveBeenCalledTimes(1)
  })

  it('deve disparar onOpen ao clicar no botão durante o streaming ativo', () => {
    const handleOpen = vi.fn()
    const { container } = render(
      <ChatWidgetTrigger
        isStreaming
        positionClass="right-6 bottom-6"
        onOpen={handleOpen}
      />
    )

    expect(container.querySelector('[data-testid="chat-streaming-indicator"]')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(button)

    expect(handleOpen).toHaveBeenCalledTimes(1)
  })

  it('mostra o rótulo visível e só exibe o indicador de resposta durante o streaming', () => {
    const { container } = render(
      <ChatWidgetTrigger
        isStreaming={false}
        positionClass="right-6 bottom-6"
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })).toHaveTextContent('Assistente')
    expect(container.querySelector('[data-testid="chat-streaming-indicator"]')).not.toBeInTheDocument()
  })
})
