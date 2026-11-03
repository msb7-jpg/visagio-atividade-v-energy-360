import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  classesFixture,
  decompositionFixture,
  historyFixture,
  kpisFixture,
  municipalitiesFixture,
  neighborhoodsFixture
} from '@/features/revenue/__tests__/revenueFixtures'
import { revenueApi } from '@/features/revenue/api/revenueApi'
import { RevenueDashboardPage } from '@/features/revenue/components/RevenueDashboardPage'
import type { BreakdownControls } from '@/features/revenue/types/revenueTypes'

vi.mock('@/features/revenue/api/revenueApi', () => ({
  revenueApi: { getKpis: vi.fn(), getDecomposition: vi.fn(), getBreakdown: vi.fn(), getHistory: vi.fn() }
}))

const mockUseProactiveInsights = vi.hoisted(() => vi.fn())
vi.mock('@/features/insights/queries/useProactiveInsights', () => ({
  useProactiveInsights: mockUseProactiveInsights
}))

const mockedApi = vi.mocked(revenueApi)

const NO_INSIGHT = { data: undefined, isLoading: false, isError: false, refetch: vi.fn(), isFetching: false }

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RevenueDashboardPage />
    </QueryClientProvider>
  )
}

function apiError(status: number, detail: string): AxiosError {
  const response = { status, data: { detail } } as AxiosResponse
  return new AxiosError('Request failed', String(status), undefined, undefined, response)
}

function mockHappyPath() {
  mockedApi.getKpis.mockResolvedValue(kpisFixture)
  mockedApi.getDecomposition.mockResolvedValue(decompositionFixture)
  mockedApi.getHistory.mockResolvedValue(historyFixture)
  mockedApi.getBreakdown.mockImplementation(async (_query, controls: BreakdownControls) => {
    if (controls.nivel === 'municipio') {
      return municipalitiesFixture
    }
    return controls.nivel === 'classe_consumo' ? classesFixture : neighborhoodsFixture
  })
}

describe('RevenueDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProactiveInsights.mockReturnValue(NO_INSIGHT)
  })

  it('mostra título, indicadores e a ponte de receita quando a API responde', async () => {
    mockHappyPath()

    renderPage()

    expect(screen.getByRole('heading', { name: 'Inteligência Comercial' })).toBeInTheDocument()
    expect(await screen.findByText('Faturamento')).toBeInTheDocument()
    expect(screen.getByText('Volume faturado')).toBeInTheDocument()
    expect(await screen.findByText(/A receita caiu/)).toBeInTheDocument()
  })

  it('mostra o Smart Insight da receita com as janelas e os números da decomposição', async () => {
    mockHappyPath()
    mockUseProactiveInsights.mockReturnValue({
      ...NO_INSIGHT,
      data: { resumo_executivo: 'A receita caiu 4% porque o volume recuou.', insights: ['Volume caiu 5,8%.'] }
    })

    renderPage()

    expect(await screen.findByText('Smart Insights IA')).toBeInTheDocument()
    expect(screen.getByText('A receita caiu 4% porque o volume recuou.')).toBeInTheDocument()
    expect(mockUseProactiveInsights).toHaveBeenLastCalledWith({
      context: 'revenue',
      filtros: expect.objectContaining({ base: expect.any(String), atual: expect.any(String) }),
      metricas: expect.objectContaining({ variacao_receita_pct: -4, variacao_volume_pct: -5.8 })
    })
  })

  it('não consulta a IA com números misturados enquanto a decomposição do novo recorte não chegou', async () => {
    mockHappyPath()
    renderPage()
    await screen.findByRole('option', { name: 'OLINDA' })
    await waitFor(() => expect(mockUseProactiveInsights).toHaveBeenCalled())
    mockUseProactiveInsights.mockClear()
    mockedApi.getDecomposition.mockReturnValue(new Promise(() => {}))

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'OLINDA' } })
    await waitFor(() =>
      expect(mockedApi.getKpis).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { municipio: 'OLINDA' } }),
        expect.anything()
      )
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockUseProactiveInsights).not.toHaveBeenCalled()
  })

  it('não consulta a IA enquanto a decomposição não chegou', async () => {
    mockHappyPath()
    mockedApi.getDecomposition.mockReturnValue(new Promise(() => {}))

    renderPage()
    await screen.findByText('Faturamento')

    expect(mockUseProactiveInsights).not.toHaveBeenCalled()
  })

  it('alimenta os filtros com os municípios e classes que existem na base', async () => {
    mockHappyPath()

    renderPage()

    expect(await screen.findByRole('option', { name: 'OLINDA' })).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: 'B3' })).toBeInTheDocument()
  })

  it('refaz as consultas com o município escolhido', async () => {
    mockHappyPath()
    renderPage()
    await screen.findByRole('option', { name: 'OLINDA' })

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'OLINDA' } })

    await waitFor(() =>
      expect(mockedApi.getKpis).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { municipio: 'OLINDA' } }),
        expect.anything()
      )
    )
  })

  it('filtra por bairro depois de escolher o município e limpa o bairro ao trocar de município', async () => {
    mockHappyPath()
    renderPage()
    await screen.findByRole('option', { name: 'RECIFE' })
    expect(screen.getByLabelText('Bairro')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'RECIFE' } })
    await screen.findByRole('option', { name: 'CASA AMARELA' })
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'CASA AMARELA' } })

    await waitFor(() =>
      expect(mockedApi.getKpis).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { municipio: 'RECIFE', bairro: 'CASA AMARELA' } }),
        expect.anything()
      )
    )
    expect(mockedApi.getBreakdown).toHaveBeenCalledWith(
      expect.objectContaining({ filters: { municipio: 'RECIFE' } }),
      expect.objectContaining({ nivel: 'bairro', page_size: 100 }),
      expect.anything()
    )

    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'OLINDA' } })

    await waitFor(() => expect(screen.getByLabelText('Bairro')).toHaveValue(''))
  })

  it('abre o histórico do bairro escolhido no ranking', async () => {
    mockHappyPath()
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: /Ranking territorial/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'BOA VIAGEM' }))

    expect(await screen.findByText(/RECIFE · últimos 24 meses/)).toBeInTheDocument()
    await waitFor(() =>
      expect(mockedApi.getHistory).toHaveBeenCalledWith(
        expect.anything(),
        { municipio: 'RECIFE', bairro: 'BOA VIAGEM' },
        expect.anything()
      )
    )
  })

  it('suspende as consultas e avisa quando as janelas ficam inválidas', async () => {
    mockHappyPath()
    renderPage()
    await screen.findByText('Faturamento')
    const callsBefore = mockedApi.getKpis.mock.calls.length

    fireEvent.change(document.getElementById('base-fim') as HTMLInputElement, { target: { value: '2026-01-31' } })

    expect(await screen.findByText('Ajuste os períodos para ver os resultados')).toBeInTheDocument()
    expect(mockedApi.getKpis.mock.calls).toHaveLength(callsBefore)
    expect(screen.queryByText('Faturamento')).not.toBeInTheDocument()
  })

  it('mostra a mensagem do backend quando não há faturamento no recorte', async () => {
    mockHappyPath()
    mockedApi.getKpis.mockRejectedValue(apiError(404, 'Nenhum dado de faturamento encontrado.'))

    renderPage()

    expect(await screen.findByText('Nenhum dado de faturamento encontrado.')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível carregar os indicadores')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Decomposição/ })).not.toBeInTheDocument()
  })

  it('mostra texto genérico quando o erro não vem da API', async () => {
    mockHappyPath()
    mockedApi.getKpis.mockRejectedValue(new Error('rede'))

    renderPage()

    expect(await screen.findByText(/Não foi possível carregar os dados de receita/)).toBeInTheDocument()
  })
})
