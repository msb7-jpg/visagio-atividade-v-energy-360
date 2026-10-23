import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { qualityApi } from '@/features/grid_quality/api/qualityApi'
import { GridQualityPage } from '@/features/grid_quality/components/GridQualityPage'
import type {
  FeederHistory,
  FeederRanking,
  QualityIndicators
} from '@/features/grid_quality/types/qualityTypes'

vi.mock('@/features/grid_quality/api/qualityApi', () => ({
  qualityApi: {
    getIndicators: vi.fn(),
    listFeeders: vi.fn(),
    getFeederHistory: vi.fn()
  }
}))

const mockedApi = vi.mocked(qualityApi)

// Valores fictícios e redondos no contrato novo (ADR-003); não representam dados do case.
const indicators: QualityIndicators = {
  competencia: '2000-03',
  dec_medio_horas: 18.5,
  fec_medio_vezes: 9.25,
  total_alimentadores: 2,
  alimentadores_em_violacao: 1,
  percentual_violacao: 50
}

const violatingFeeder: FeederRanking = {
  id_alimentador: 'ALIM-TESTE-01',
  competencia: '2000-03',
  dec_apurado_horas: 3,
  fec_apurado_vezes: 1,
  dec_acumulado_ano_horas: 25,
  fec_acumulado_ano_vezes: 8,
  dec_limite_horas: 20,
  fec_limite_vezes: 10,
  delta_dec_horas: 5,
  status: 'violacao',
  conjunto_aneel: 'CONJUNTO TESTE',
  criterio_limite: 'CONJUNTO',
  ucs_atendidas: 200
}

const approximateLimitFeeder: FeederRanking = {
  ...violatingFeeder,
  id_alimentador: 'ALIM-TESTE-02',
  dec_acumulado_ano_horas: 12,
  fec_acumulado_ano_vezes: 4,
  delta_dec_horas: -8,
  status: 'conforme',
  conjunto_aneel: 'MEDIANA RMR',
  criterio_limite: 'MEDIANA_RMR'
}

const history: FeederHistory = {
  id_alimentador: 'ALIM-TESTE-01',
  pontos: [
    { ...violatingFeeder, competencia: '1999-12', dec_apurado_horas: 4, dec_acumulado_ano_horas: 22 },
    { ...violatingFeeder, competencia: '2000-01', dec_apurado_horas: 2, dec_acumulado_ano_horas: 2 }
  ]
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <GridQualityPage />
    </QueryClientProvider>
  )
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('GridQualityPage', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.getIndicators.mockResolvedValue(indicators)
    mockedApi.listFeeders.mockResolvedValue([violatingFeeder, approximateLimitFeeder])
    mockedApi.getFeederHistory.mockResolvedValue(history)
  })

  it('mostra os cards com a média do acumulado no ano e a contagem de violações', async () => {
    renderPage()

    expect(await screen.findByText('18,5')).toBeInTheDocument()
    expect(screen.getByText('9,25')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('1 de 2 circuitos.')).toBeInTheDocument()
    expect(screen.getAllByText(/Média do acumulado no ano até 03\/2000/)).toHaveLength(2)
    expect(screen.getAllByText(/limite de referência \(suposição pendente, B1\)/)).toHaveLength(2)
  })

  it('mostra o acumulado no ano ao lado do limite anual e o status de cada alimentador', async () => {
    renderPage()

    const violatingRow = await screen.findByRole('row', { name: /ALIM-TESTE-01/ })

    expect(within(violatingRow).getByText('25')).toBeInTheDocument()
    expect(within(violatingRow).getByText('20')).toBeInTheDocument()
    expect(within(violatingRow).getByText('5')).toBeInTheDocument()
    expect(within(violatingRow).getByText('Violação Crítica')).toBeInTheDocument()
    expect(within(violatingRow).queryByText('Limite aproximado')).not.toBeInTheDocument()
  })

  it('indica limite aproximado só quando o critério é a mediana da RMR', async () => {
    renderPage()

    const approximateRow = await screen.findByRole('row', { name: /ALIM-TESTE-02/ })

    expect(within(approximateRow).getByText('Limite aproximado')).toBeInTheDocument()
    expect(within(approximateRow).getByText('Conforme')).toBeInTheDocument()
    expect(screen.getAllByText('Limite aproximado')).toHaveLength(1)
  })

  it('filtra o ranking pelo status escolhido', async () => {
    renderPage()
    await screen.findByRole('row', { name: /ALIM-TESTE-01/ })

    fireEvent.change(screen.getByLabelText('Status regulatório'), { target: { value: 'violacao' } })

    await vi.waitFor(() => expect(mockedApi.listFeeders).toHaveBeenLastCalledWith('violacao', expect.anything()))
  })

  it('abre a gaveta com o histórico do alimentador ao clicar no código', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'ALIM-TESTE-01' }))

    expect(await screen.findByText('Alimentador ALIM-TESTE-01')).toBeInTheDocument()
    expect(await screen.findByText('DEC acumulado no ano (h)')).toBeInTheDocument()
    expect(mockedApi.getFeederHistory).toHaveBeenCalledWith('ALIM-TESTE-01', expect.anything())
  })

  it('explica quando nenhum alimentador atende ao filtro', async () => {
    mockedApi.listFeeders.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Nenhum alimentador neste filtro')).toBeInTheDocument()
  })

  it('avisa quando os indicadores ou o ranking não carregam', async () => {
    mockedApi.getIndicators.mockRejectedValue(new Error('falha'))
    mockedApi.listFeeders.mockRejectedValue(new Error('falha'))
    renderPage()

    expect(await screen.findByText('Não foi possível carregar os indicadores')).toBeInTheDocument()
    expect(await screen.findByText('Não foi possível carregar os alimentadores')).toBeInTheDocument()
  })
})
