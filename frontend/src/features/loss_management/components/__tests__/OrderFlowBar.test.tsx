import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderFlowBar } from '@/features/loss_management/components/OrderFlowBar'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

vi.mock('@/features/loss_management/hooks/useCanWriteLosses', () => ({ useCanWriteLosses: vi.fn(() => true) }))

describe('OrderFlowBar', () => {
  beforeEach(() => {
    vi.mocked(useCanWriteLosses).mockReturnValue(true)
  })

  it('tem só o botão Registrar achado, e não exportar nem importar', () => {
    render(<OrderFlowBar onRegister={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Registrar achado' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Exportar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Importar/ })).not.toBeInTheDocument()
  })

  it('pinta o Registrar achado de azul, com a variante principal', () => {
    render(<OrderFlowBar onRegister={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Registrar achado' })).toHaveClass('bg-primary')
  })

  it('abre o registro ao clicar em Registrar achado', () => {
    const onRegister = vi.fn()
    render(<OrderFlowBar onRegister={onRegister} />)

    fireEvent.click(screen.getByRole('button', { name: 'Registrar achado' }))

    expect(onRegister).toHaveBeenCalledOnce()
  })

  it('mostra só a legenda do ciclo para quem não pode editar perdas', () => {
    vi.mocked(useCanWriteLosses).mockReturnValue(false)
    render(<OrderFlowBar onRegister={vi.fn()} />)

    expect(screen.getByLabelText('Ciclo da ordem de inspeção')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
