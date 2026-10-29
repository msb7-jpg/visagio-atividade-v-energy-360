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

    const pingIndicator = container.querySelector('.animate-ping')
    expect(pingIndicator).toBeInTheDocument()
    expect(pingIndicator).toHaveClass('pointer-events-none')

    const button = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(button)

    expect(handleOpen).toHaveBeenCalledTimes(1)
  })

  it('deve possuir estilização circular e acessibilidade de foco no botão principal', () => {
    const handleOpen = vi.fn()
    const { container } = render(
      <ChatWidgetTrigger
        isStreaming
        positionClass="right-6 bottom-6"
        onOpen={handleOpen}
      />
    )

    const circularContainer = container.querySelector('.size-14')
    expect(circularContainer).toBeInTheDocument()
    expect(circularContainer).toHaveClass('rounded-full')

    const button = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(button)

    expect(handleOpen).toHaveBeenCalledTimes(1)
  })
})
