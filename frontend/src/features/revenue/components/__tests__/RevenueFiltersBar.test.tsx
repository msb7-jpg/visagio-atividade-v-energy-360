import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RevenueFiltersBar } from '@/features/revenue/components/RevenueFiltersBar'
import { DEFAULT_REVENUE_QUERY } from '@/features/revenue/utils/revenueFilters'

function setup(windowError: string | null = null) {
  const handlers = { onMonthChange: vi.fn(), onFilterChange: vi.fn(), onReset: vi.fn() }
  render(
    <RevenueFiltersBar
      query={DEFAULT_REVENUE_QUERY}
      windowError={windowError}
      municipalities={['OLINDA', 'RECIFE']}
      classes={['B1', 'B3']}
      {...handlers}
    />
  )
  return handlers
}

describe('RevenueFiltersBar', () => {
  it('mostra o primeiro dia do mês inicial e o último dia do mês final', () => {
    setup()

    const [baseStart, baseEnd] = screen.getAllByLabelText(/^(De|Até)$/)
    expect(baseStart).toHaveValue('2022-07-01')
    expect(baseEnd).toHaveValue('2023-06-30')
  })

  it('avisa qual janela foi alterada e reduz a data escolhida ao mês', () => {
    const handlers = setup()

    fireEvent.change(document.getElementById('atual-fim') as HTMLInputElement, { target: { value: '2026-05-15' } })

    expect(handlers.onMonthChange).toHaveBeenCalledWith('atual', 'fim', '2026-05')
  })

  it('lista os municípios e classes recebidos e avisa a escolha', () => {
    const handlers = setup()

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'RECIFE' } })
    fireEvent.change(screen.getByLabelText('Classe de consumo'), { target: { value: 'B1' } })

    expect(handlers.onFilterChange).toHaveBeenNthCalledWith(1, 'municipio', 'RECIFE')
    expect(handlers.onFilterChange).toHaveBeenNthCalledWith(2, 'classe_consumo', 'B1')
    expect(screen.getByRole('option', { name: 'Todos os municípios' })).toBeInTheDocument()
  })

  it('restaura o padrão', () => {
    const handlers = setup()

    fireEvent.click(screen.getByRole('button', { name: /Restaurar padrão/ }))

    expect(handlers.onReset).toHaveBeenCalledTimes(1)
  })

  it('mostra o aviso quando as janelas são inválidas', () => {
    setup('O período base precisa terminar antes.')

    expect(screen.getByText('Ajuste os períodos')).toBeInTheDocument()
    expect(screen.getByText('O período base precisa terminar antes.')).toBeInTheDocument()
  })
})
