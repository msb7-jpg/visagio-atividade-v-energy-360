import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SmartInsightCard } from './SmartInsightCard'

const mockUseProactiveInsights = vi.fn()

vi.mock('@/features/insights/queries/useProactiveInsights', () => ({
  useProactiveInsights: (payload: unknown) => mockUseProactiveInsights(payload)
}))

describe('SmartInsightCard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

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
    expect(screen.getByText('Gerando síntese executiva...')).toBeInTheDocument()
  })

  it('deve iniciar recolhido exibindo o resumo em uma linha e botão Expandir', () => {
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
    expect(screen.getByText('Expandir')).toBeInTheDocument()
    expect(screen.queryByText('Canibalização de receita concentrada no subgrupo B1.')).not.toBeInTheDocument()
  })

  it('deve alternar entre expandido e minimizado e persistir no localStorage', () => {
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
    const expandButton = screen.getByText('Expandir')
    fireEvent.click(expandButton)

    expect(screen.getByText('Minimizar')).toBeInTheDocument()
    expect(screen.getByText('Canibalização de receita concentrada no subgrupo B1.')).toBeInTheDocument()
    expect(localStorage.getItem('venergy_insight_collapsed_revenue')).toBe('false')

    const minimizeButton = screen.getByText('Minimizar')
    fireEvent.click(minimizeButton)

    expect(screen.getByText('Expandir')).toBeInTheDocument()
    expect(screen.queryByText('Canibalização de receita concentrada no subgrupo B1.')).not.toBeInTheDocument()
    expect(localStorage.getItem('venergy_insight_collapsed_revenue')).toBe('true')
  })

  it('deve respeitar estado expandido pré-salvo no localStorage', () => {
    localStorage.setItem('venergy_insight_collapsed_executive', 'false')
    mockUseProactiveInsights.mockReturnValue({
      data: {
        resumo_executivo: 'Indicadores operacionais estáveis.',
        insights: ['Eficiência de arrecadação em 98%.']
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false
    })

    render(<SmartInsightCard context="executive" />)
    expect(screen.getByText('Minimizar')).toBeInTheDocument()
    expect(screen.getByText('Eficiência de arrecadação em 98%.')).toBeInTheDocument()
  })
})
