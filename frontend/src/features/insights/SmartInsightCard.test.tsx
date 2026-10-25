import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmartInsightCard } from './SmartInsightCard'

const mockUseProactiveInsights = vi.fn()

vi.mock('@/features/insights/queries/useProactiveInsights', () => ({
  useProactiveInsights: (payload: unknown) => mockUseProactiveInsights(payload)
}))

describe('SmartInsightCard', () => {
  it('não deve renderizar nada quando isError for true (provedor indisponível / 503)', () => {
    mockUseProactiveInsights.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
      isFetching: false
    })

    const { container } = render(<SmartInsightCard context="customer360" />)
    expect(container.firstChild).toBeNull()
  })

  it('deve exibir skeleton pulsante enquanto está carregando proativamente', () => {
    mockUseProactiveInsights.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isFetching: true
    })

    render(<SmartInsightCard context="revenue" />)
    expect(screen.getByText('Smart Insights IA')).toBeInTheDocument()
    expect(screen.getByText('REVENUE')).toBeInTheDocument()
  })

  it('deve renderizar o resumo executivo e insights quando os dados chegarem', () => {
    mockUseProactiveInsights.mockReturnValue({
      data: {
        resumo_executivo: 'Retração identificada de 3,8% no volume faturado.',
        insights: [
          'Canibalização de receita concentrada no subgrupo B1.',
          'Penetração de GD solar superou 12 MWp na área monitorada.'
        ]
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false
    })

    render(<SmartInsightCard context="revenue" />)
    expect(screen.getByText('Smart Insights IA')).toBeInTheDocument()
    expect(screen.getByText('Retração identificada de 3,8% no volume faturado.')).toBeInTheDocument()
    expect(screen.getByText('Canibalização de receita concentrada no subgrupo B1.')).toBeInTheDocument()
  })
})
