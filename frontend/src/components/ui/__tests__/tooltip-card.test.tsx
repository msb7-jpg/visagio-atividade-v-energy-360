import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from '@/components/ui/tooltip-card'

function mockHover(hasHover: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(hover: none)' ? !hasHover : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
}

function renderTooltip() {
  render(
    <div>
      <Tooltip content="Explicação da fórmula">
        <span tabIndex={0}>Gatilho</span>
      </Tooltip>
      <button type="button">Fora</button>
    </div>
  )
  return screen.getByText('Gatilho')
}

describe('Tooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('abre ao passar o mouse e fecha ao sair', async () => {
    mockHover(true)
    const trigger = renderTooltip()

    fireEvent.mouseEnter(trigger.parentElement as HTMLElement)
    expect(screen.getByText('Explicação da fórmula')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger.parentElement as HTMLElement)
    await waitFor(() => expect(screen.queryByText('Explicação da fórmula')).not.toBeInTheDocument())
  })

  it('abre quando o gatilho recebe o foco do teclado e fecha ao perder o foco', async () => {
    mockHover(true)
    const trigger = renderTooltip()

    act(() => trigger.focus())
    expect(screen.getByText('Explicação da fórmula')).toBeInTheDocument()

    act(() => trigger.blur())
    await waitFor(() => expect(screen.queryByText('Explicação da fórmula')).not.toBeInTheDocument())
  })

  it('no toque abre com um toque, fecha com outro e ignora os eventos de mouse simulados', async () => {
    mockHover(false)
    const trigger = renderTooltip()
    const container = trigger.parentElement as HTMLElement

    fireEvent.mouseEnter(container)
    expect(screen.queryByText('Explicação da fórmula')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.getByText('Explicação da fórmula')).toBeInTheDocument()

    fireEvent.click(trigger)
    await waitFor(() => expect(screen.queryByText('Explicação da fórmula')).not.toBeInTheDocument())
  })

  it('no toque fecha ao tocar fora', async () => {
    mockHover(false)
    const trigger = renderTooltip()

    fireEvent.click(trigger)
    expect(screen.getByText('Explicação da fórmula')).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fora' }))
    await waitFor(() => expect(screen.queryByText('Explicação da fórmula')).not.toBeInTheDocument())
  })
})
