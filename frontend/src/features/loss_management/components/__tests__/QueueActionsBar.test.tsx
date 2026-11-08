import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueActionsBar } from '@/features/loss_management/components/QueueActionsBar'

const canWrite = vi.hoisted(() => ({ value: true }))
vi.mock('@/features/loss_management/hooks/useCanWriteLosses', () => ({ useCanWriteLosses: () => canWrite.value }))

function renderBar(overrides: Partial<Parameters<typeof QueueActionsBar>[0]> = {}) {
  const props = {
    selectedCount: 0,
    topCountText: '10',
    onTopCountTextChange: vi.fn(),
    onSelectTop: vi.fn(),
    onGenerate: vi.fn(),
    ...overrides
  }
  render(<QueueActionsBar {...props} />)
  return props
}

describe('QueueActionsBar', () => {
  it('marca as N primeiras UCs livres com o N digitado, e não mais um número fixo', () => {
    const props = renderBar({ topCountText: '25' })

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar as 25 primeiras UCs livres' }))

    expect(props.onSelectTop).toHaveBeenCalledOnce()
  })

  it('avisa o N digitado ao componente pai', () => {
    const props = renderBar()

    fireEvent.change(screen.getByLabelText('Quantas UCs inspecionar'), { target: { value: '40' } })

    expect(props.onTopCountTextChange).toHaveBeenCalledWith('40')
  })

  it('desliga o botão de marcar quando o N digitado não é um inteiro positivo', () => {
    renderBar({ topCountText: 'abc' })

    expect(screen.getByRole('button', { name: /Selecionar as .* primeiras UCs livres/ })).toBeDisabled()
  })

  it('gera as ordens das UCs marcadas e fica desligado sem seleção', () => {
    const props = renderBar({ selectedCount: 3 })

    fireEvent.click(screen.getByRole('button', { name: /Gerar 3/ }))

    expect(props.onGenerate).toHaveBeenCalledOnce()
  })

  it('esconde "Gerar" de quem só consulta', () => {
    canWrite.value = false
    renderBar({ selectedCount: 3 })
    canWrite.value = true

    expect(screen.queryByRole('button', { name: /Gerar/ })).not.toBeInTheDocument()
  })
})
