import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { UseQueryResult } from '@tanstack/react-query'
import { historyFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { NeighborhoodHistoryPanel } from '@/features/revenue/components/NeighborhoodHistoryPanel'
import type { NeighborhoodHistory } from '@/features/revenue/types/revenueTypes'

describe('NeighborhoodHistoryPanel', () => {
  it('mostra mensagem quando nenhum bairro está selecionado', () => {
    const query = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    } as unknown as UseQueryResult<NeighborhoodHistory>

    render(<NeighborhoodHistoryPanel neighborhood={null} historyQuery={query} />)
    expect(screen.getByText('Selecione um bairro na tabela')).toBeInTheDocument()
  })

  it('renderiza o bairro selecionado com abas de métricas e gráfico', () => {
    const query = {
      data: historyFixture,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    } as unknown as UseQueryResult<NeighborhoodHistory>

    render(
      <NeighborhoodHistoryPanel
        neighborhood={{ municipio: 'RECIFE', bairro: 'BOA VIAGEM' }}
        historyQuery={query}
      />
    )

    expect(screen.getByText('BOA VIAGEM')).toBeInTheDocument()
    expect(screen.getByText('RECIFE')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Receita' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Volume' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tarifa' })).toBeInTheDocument()
    expect(screen.getAllByText(/1\.550,00/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('tab', { name: 'Volume' }))
    expect(screen.getAllByText('2,5 MWh').length).toBeGreaterThan(0)
  })
})
