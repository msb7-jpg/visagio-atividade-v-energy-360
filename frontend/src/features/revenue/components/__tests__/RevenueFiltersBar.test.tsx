import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RevenueFiltersBar } from '@/features/revenue/components/RevenueFiltersBar'
import type { RevenueFilters } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_REVENUE_QUERY } from '@/features/revenue/utils/revenueFilters'

function setup(windowError: string | null = null, filters: RevenueFilters = {}) {
  const handlers = { onWindowsChange: vi.fn(), onFilterChange: vi.fn(), onReset: vi.fn() }
  render(
    <RevenueFiltersBar
      query={{ ...DEFAULT_REVENUE_QUERY, filters }}
      windowError={windowError}
      municipalities={['OLINDA', 'RECIFE']}
      neighborhoods={['BOA VIAGEM', 'CASA AMARELA']}
      classes={['B1', 'B3']}
      {...handlers}
    />
  )
  return handlers
}

function openFilters() {
  fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }))
}

describe('RevenueFiltersBar', () => {
  it('abre na pergunta do case e diz quais meses estão sendo comparados', () => {
    setup()

    expect(screen.getByLabelText('Período')).toHaveValue('last12')
    expect(screen.getByLabelText('Comparar com')).toHaveValue('case')
    expect(screen.getByText('jul/2025 a jun/2026')).toBeInTheDocument()
    expect(screen.getByText('jul/2022 a jun/2023')).toBeInTheDocument()
  })

  it('calcula a base sozinha ao trocar o período e a comparação', () => {
    const handlers = setup()

    fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'year-2025' } })
    expect(handlers.onWindowsChange).toHaveBeenLastCalledWith({
      atual: { inicio: '2025-01', fim: '2025-12' },
      base: { inicio: '2022-07', fim: '2023-06' }
    })

    fireEvent.change(screen.getByLabelText('Comparar com'), { target: { value: 'yoy' } })
    expect(handlers.onWindowsChange).toHaveBeenLastCalledWith({
      atual: { inicio: '2025-07', fim: '2026-06' },
      base: { inicio: '2024-07', fim: '2025-06' }
    })
  })

  it('escolhe o mês exato no calendário de meses', async () => {
    const handlers = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Personalizar datas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fim: período analisado: jun/2026' }))
    fireEvent.click(await screen.findByRole('button', { name: 'mai/2026' }))

    expect(handlers.onWindowsChange).toHaveBeenLastCalledWith({
      atual: { inicio: '2025-07', fim: '2026-05' },
      base: { inicio: '2022-07', fim: '2023-06' }
    })
  })

  it('lista os municípios e classes recebidos e avisa a escolha', () => {
    const handlers = setup()
    openFilters()

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'RECIFE' } })
    fireEvent.change(screen.getByLabelText('Classe de consumo'), { target: { value: 'B1' } })

    expect(handlers.onFilterChange).toHaveBeenNthCalledWith(1, 'municipio', 'RECIFE')
    expect(handlers.onFilterChange).toHaveBeenNthCalledWith(2, 'classe_consumo', 'B1')
    expect(screen.getByRole('option', { name: 'Todos os municípios' })).toBeInTheDocument()
  })

  it('só libera o bairro depois de escolher o município', () => {
    setup()
    openFilters()

    const neighborhood = screen.getByLabelText('Bairro')
    expect(neighborhood).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Escolha um município' })).toBeInTheDocument()
  })

  it('lista os bairros do município escolhido e avisa a escolha', () => {
    const handlers = setup(null, { municipio: 'RECIFE' })
    openFilters()

    const neighborhood = screen.getByLabelText('Bairro')
    expect(neighborhood).toBeEnabled()
    fireEvent.change(neighborhood, { target: { value: 'CASA AMARELA' } })

    expect(screen.getByRole('option', { name: 'Todos os bairros' })).toBeInTheDocument()
    expect(handlers.onFilterChange).toHaveBeenCalledWith('bairro', 'CASA AMARELA')
  })

  it('mostra um chip por filtro ativo e limpa município e classe', () => {
    const handlers = setup(null, { municipio: 'RECIFE', classe_consumo: 'B1' })

    expect(screen.getByRole('button', { name: 'Remover filtro Município: RECIFE' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(handlers.onFilterChange).toHaveBeenCalledWith('classe_consumo', '')
    expect(handlers.onFilterChange).toHaveBeenCalledWith('municipio', '')
  })

  it('restaura o padrão só quando algo mudou', () => {
    setup()
    expect(screen.getByRole('button', { name: /Restaurar padrão/ })).toBeDisabled()
  })

  it('restaura o padrão com um filtro ativo', () => {
    const handlers = setup(null, { municipio: 'RECIFE' })

    fireEvent.click(screen.getByRole('button', { name: /Restaurar padrão/ }))

    expect(handlers.onReset).toHaveBeenCalledTimes(1)
  })

  it('mostra o aviso quando as janelas são inválidas', () => {
    setup('O período base precisa terminar antes.')

    expect(screen.getByText('Ajuste os períodos')).toBeInTheDocument()
    expect(screen.getByText('O período base precisa terminar antes.')).toBeInTheDocument()
  })
})
