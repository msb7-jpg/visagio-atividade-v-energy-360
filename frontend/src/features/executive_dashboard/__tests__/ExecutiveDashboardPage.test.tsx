import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executiveDashboardApi } from '@/features/executive_dashboard/api/executiveDashboardApi'
import { ExecutiveDashboardPage } from '@/features/executive_dashboard/components/ExecutiveDashboardPage'
import type {
  DashboardIndicators,
  Indicator,
  LossesSnapshot
} from '@/features/executive_dashboard/types/executiveDashboardTypes'

vi.mock('@/features/executive_dashboard/api/executiveDashboardApi', () => ({
  executiveDashboardApi: {
    getIndicators: vi.fn(),
    getLossesSnapshot: vi.fn()
  }
}))

const mockedApi = vi.mocked(executiveDashboardApi)

// Valores fictícios e redondos no formato do contrato (seção 6 do plano); não representam dados do case.
const revenue: Indicator = {
  id: 'faturamento',
  titulo: 'Faturamento',
  unidade: 'RS',
  base: 1000,
  atual: 1100,
  variacao_pct: 10,
  variacao_pp: null,
  sentido: 'MAIOR_MELHOR',
  avaliacao: 'MELHOROU',
  explicacao: 'Soma do valor total das faturas emitidas no período.',
  detalhe: null,
  aviso: null
}

const outageHours: Indicator = {
  ...revenue,
  id: 'dec_area',
  titulo: 'Horas sem energia por cliente',
  unidade: 'HORAS',
  base: 4,
  atual: 6,
  variacao_pct: 50,
  sentido: 'MENOR_MELHOR',
  avaliacao: 'PIOROU',
  aviso: 'Jul/2025 teve um temporal.'
}

const overdue: Indicator = {
  ...revenue,
  id: 'inadimplencia',
  titulo: 'Inadimplência',
  unidade: 'PCT',
  base: 3.55,
  atual: 3.6,
  variacao_pct: 1.4,
  variacao_pp: 0.05,
  sentido: 'MENOR_MELHOR',
  avaliacao: 'ESTAVEL',
  detalhe: { titulo: 'Valor vencido', unidade: 'RS', base: 5_600_000, atual: 6_100_000 }
}

const indicators: DashboardIndicators = {
  base: { competencia_inicio: '2022-07', competencia_fim: '2023-06' },
  atual: { competencia_inicio: '2025-07', competencia_fim: '2026-06' },
  periodo_disponivel: { competencia_inicio: '2022-07', competencia_fim: '2026-06' },
  grupos: [
    { id: 'comercial', titulo: 'Comercial', indicadores: [revenue] },
    { id: 'cobranca', titulo: 'Cobrança', indicadores: [overdue] },
    { id: 'rede', titulo: 'Rede', indicadores: [outageHours] }
  ]
}

const losses: LossesSnapshot = {
  competencia_referencia: '2026-06',
  competencia_fixada: false,
  ucs_na_fila: 12,
  energia_recuperavel_kwh_mes: 1500,
  valor_recuperavel_rs_ano: 12000,
  taxa_acerto_pct: 50,
  inspecoes_avaliadas: 20
}

function renderPage(initialEntry = '/dashboard') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ExecutiveDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ExecutiveDashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedApi.getIndicators.mockResolvedValue(indicators)
    mockedApi.getLossesSnapshot.mockResolvedValue(losses)
  })

  it('mostra cada grupo com os dois períodos, a variação e o selo', async () => {
    renderPage()

    const revenueCard = await screen.findByTestId('indicator-faturamento')
    expect(screen.getByRole('heading', { name: 'Comercial' })).toBeTruthy()
    expect(within(revenueCard).getByText('Melhorou')).toBeTruthy()
    expect(within(revenueCard).getByText('+10%')).toBeTruthy()
    expect(within(revenueCard).getByText(/Antes:/)).toBeTruthy()
    const outageCard = screen.getByTestId('indicator-dec_area')
    expect(within(outageCard).getByText('Piorou')).toBeTruthy()
    expect(within(outageCard).getByText('Jul/2025 teve um temporal.')).toBeTruthy()
  })

  it('mostra a variação das taxas em pontos percentuais', async () => {
    renderPage()

    const overdueCard = await screen.findByTestId('indicator-inadimplencia')
    expect(within(overdueCard).getByText('+0,05 ponto percentual')).toBeTruthy()
    expect(within(overdueCard).getByText(/Valor vencido: R\$\s6,1\smi/)).toBeTruthy()
    expect(within(overdueCard).getByText('Estável')).toBeTruthy()
  })

  it('consulta os períodos padrão do case sem parâmetros na URL', async () => {
    renderPage()

    await screen.findByTestId('indicator-faturamento')
    expect(mockedApi.getIndicators).toHaveBeenCalledWith(
      { base: indicators.base, atual: indicators.atual },
      expect.anything()
    )
    expect(screen.getByText(/Compara jul\/2025 a jun\/2026 com jul\/2022 a jun\/2023/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /Voltar ao padrão/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('troca o período e volta ao padrão', async () => {
    renderPage()
    await screen.findByTestId('indicator-faturamento')

    fireEvent.change(screen.getByLabelText('De', { selector: '#periodo-atual-competencia_inicio' }), {
      target: { value: '2025-08' }
    })

    await screen.findByText(/Compara ago\/2025 a jun\/2026/)
    expect(mockedApi.getIndicators).toHaveBeenLastCalledWith(
      { base: indicators.base, atual: { competencia_inicio: '2025-08', competencia_fim: '2026-06' } },
      expect.anything()
    )
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao padrão/ }))
    expect(await screen.findByText(/Compara jul\/2025 a jun\/2026/)).toBeTruthy()
  })

  it('avisa períodos sobrepostos sem consultar a API', async () => {
    renderPage('/dashboard?base_inicio=2022-07&base_fim=2025-09&atual_inicio=2025-07&atual_fim=2026-06')

    expect((await screen.findByRole('alert')).textContent).toContain('deve terminar antes')
    expect(mockedApi.getIndicators).not.toHaveBeenCalled()
  })

  it('mostra o retrato da Fila de Perdas sem comparação', async () => {
    renderPage()

    const snapshot = await screen.findByTestId('losses-snapshot')
    expect(within(snapshot).getByText('Retrato atual, sem histórico para comparar')).toBeTruthy()
    expect(within(snapshot).getByText('12')).toBeTruthy()
    expect(within(snapshot).getByText('20 inspeções avaliadas')).toBeTruthy()
    expect(within(snapshot).queryByText(/fixada para a demonstração/)).toBeNull()
  })

  it('avisa a competência fixada e a fila vazia', async () => {
    mockedApi.getLossesSnapshot.mockResolvedValue({ ...losses, competencia_fixada: true, ucs_na_fila: 0 })
    renderPage()

    const snapshot = await screen.findByTestId('losses-snapshot')
    expect(within(snapshot).getByText(/Competência fixada para a demonstração/)).toBeTruthy()
    expect(within(snapshot).getByText(/Nenhuma UC com queda suspeita/)).toBeTruthy()
  })

  it('mostra o erro dos indicadores sem esconder as perdas', async () => {
    mockedApi.getIndicators.mockRejectedValue(new Error('falha'))
    renderPage()

    expect(await screen.findByText('Não foi possível carregar os indicadores')).toBeTruthy()
    expect(await screen.findByTestId('losses-snapshot')).toBeTruthy()
  })

  it('mostra o vazio quando a API não devolve grupos', async () => {
    mockedApi.getIndicators.mockResolvedValue({ ...indicators, grupos: [] })
    renderPage()

    expect(await screen.findByText('Nenhum indicador para os períodos escolhidos')).toBeTruthy()
  })
})
