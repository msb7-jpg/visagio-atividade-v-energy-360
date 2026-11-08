import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueActionsBar } from '@/features/loss_management/components/QueueActionsBar'

const canWrite = vi.hoisted(() => ({ value: true }))
vi.mock('@/features/loss_management/hooks/useCanWriteLosses', () => ({ useCanWriteLosses: () => canWrite.value }))

function renderBar(overrides: Partial<Parameters<typeof QueueActionsBar>[0]> = {}) {
  const props = {
    selectedCount: 0,
    topCountText: '10',
    isSelecting: false,
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

    fireEvent.click(screen.getByRole('button', { name: 'Marcar as 25 primeiras' }))

    expect(props.onSelectTop).toHaveBeenCalledOnce()
  })

  it('usa o singular quando o N é 1', () => {
    renderBar({ topCountText: '1' })

    expect(screen.getByRole('button', { name: 'Marcar a primeira UC' })).toBeEnabled()
  })

  it('avisa o N digitado ao componente pai', () => {
    const props = renderBar()

    fireEvent.change(screen.getByLabelText('Quantas UCs inspecionar'), { target: { value: '40' } })

    expect(props.onTopCountTextChange).toHaveBeenCalledWith('40')
  })

  it('desliga o botão de marcar quando o N digitado não é um inteiro positivo', () => {
    renderBar({ topCountText: 'abc' })

    expect(screen.getByRole('button', { name: 'Marcar as N primeiras' })).toBeDisabled()
    expect(screen.getByLabelText('Quantas UCs inspecionar')).toHaveAttribute('aria-invalid', 'true')
  })

  it('desliga o botão enquanto as páginas da fila estão sendo carregadas para marcar', () => {
    renderBar({ isSelecting: true })

    expect(screen.getByRole('button', { name: 'Marcando…' })).toBeDisabled()
  })

  it('limita a marcação a 400 UCs por vez, o máximo que o resumo da seleção aceita, e avisa', () => {
    renderBar({ topCountText: '1000' })

    expect(screen.getByRole('button', { name: 'Marcar as 400 primeiras' })).toBeEnabled()
    expect(screen.getByText('Marca no máximo 400 UCs por vez.')).toBeInTheDocument()
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
