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
    expect(screen.getByText('Resumo da IA')).toBeInTheDocument()
    expect(screen.getByText('Gerando resumo…')).toBeInTheDocument()
  })

  it('deve iniciar recolhido exibindo o resumo em uma linha e botão Ver detalhes', () => {
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
    expect(screen.getByText('Resumo da IA')).toBeInTheDocument()
    expect(screen.getByText('Retração identificada de 3,8% no volume faturado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes' })).toBeInTheDocument()
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
    const expandButton = screen.getByRole('button', { name: 'Ver detalhes' })
    fireEvent.click(expandButton)

    expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument()
    expect(screen.getByText('Canibalização de receita concentrada no subgrupo B1.')).toBeInTheDocument()
    expect(localStorage.getItem('venergy_insight_collapsed_revenue')).toBe('false')

    const minimizeButton = screen.getByRole('button', { name: 'Ocultar' })
    fireEvent.click(minimizeButton)

    expect(screen.getByRole('button', { name: 'Ver detalhes' })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument()
    expect(screen.getByText('Eficiência de arrecadação em 98%.')).toBeInTheDocument()
  })

  it('destaca a manchete, o próximo passo, o tom e os números lidos do servidor', () => {
    mockUseProactiveInsights.mockReturnValue({
      data: {
        manchete: 'Receita subiu puxada pelo preço',
        tom: 'positivo',
        resumo_executivo: 'O reajuste compensou a queda de volume.',
        acao_recomendada: 'Acompanhar o volume nos bairros com maior queda.',
        destaques: [
          { rotulo: 'Faturamento', metrica: 'faturamento_atual', valor: 172232176.56, unidade: 'rs' },
          { rotulo: 'Variação', metrica: 'faturamento_var_pct', valor: 7.98, unidade: 'pct' },
          { rotulo: 'Horas sem energia', metrica: 'dec_area_atual', valor: 1.7, unidade: 'horas' }
        ],
        insights: ['Efeito preço maior que o efeito volume.']
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false
    })

    render(<SmartInsightCard context="executive" />)
    expect(screen.getByText('Receita subiu puxada pelo preço')).toBeInTheDocument()
    expect(screen.getByText('O reajuste compensou a queda de volume.')).toBeInTheDocument()
    expect(screen.getByText('Acompanhar o volume nos bairros com maior queda.')).toBeInTheDocument()
    expect(screen.getByText('Positivo')).toBeInTheDocument()
    expect(screen.getByText('R$ 172,2 mi')).toBeInTheDocument()
    expect(screen.getByText('+8,0%')).toBeInTheDocument()
    expect(screen.getByText('1,7 h')).toBeInTheDocument()
  })
})
