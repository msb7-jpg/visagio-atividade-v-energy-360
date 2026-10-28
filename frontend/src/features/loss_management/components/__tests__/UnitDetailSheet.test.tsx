import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: {
    listSuspiciousUnits: vi.fn(),
    getUnitDetail: vi.fn(),
    getQueueSummary: vi.fn(),
    getQueueFilters: vi.fn(),
    listInspections: vi.fn(),
    createInspection: vi.fn(),
    exportInspections: vi.fn()
  }
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/features/auth/hooks/useAuth')

const mockedApi = vi.mocked(lossApi)

const UNIT: SuspiciousUnit = {
  id_uc: 'UC100002',
  municipio: 'Olinda',
  bairro: 'Casa Caiada',
  classe_consumo: 'Residencial',
  motivos: ['queda_subita'],
  score_risco: 60,
  score: 86,
  situacao: 'na_fila',
  probabilidade_acerto: 0.93,
  consumo_base_kwh: 300,
  consumo_recente_kwh: 50,
  kwh_estimado_recuperar: 750,
  valor_estimado_recuperar_rs: 535.5,
  kwh_mes_recuperavel: 1840,
  valor_ano_rs: 15800
}

function buildDetail(overrides: Partial<UnitDetail> = {}): UnitDetail {
  return {
    id_uc: 'UC100002',
    municipio: 'Olinda',
    bairro: 'Casa Caiada',
    classe_consumo: 'Residencial',
    situacao: 'na_fila',
    competencia_referencia: '2026-06',
    motivos: ['queda_subita'],
    motivo_resumo: 'O consumo caiu de 300 para 50 kWh por mês nos últimos 3 meses.',
    consumo_base_kwh: 300,
    consumo_recente_kwh: 50,
    decomposicao_score: {
      kwh_mes_recuperavel: 1840,
      meses_janela_recuperacao: 3,
      kwh_janela_recuperavel: 5520,
      probabilidade_acerto: 0.93,
      kwh_esperado: 5133.6,
      maior_kwh_esperado_fila: 6000,
      score: 86
    },
    consumo_mensal: [
      { competencia: '2026-05', consumo_kwh: 300 },
      { competencia: '2026-06', consumo_kwh: null }
    ],
    inspecoes_anteriores: [
      { origem: 'historico_campo', data_inspecao: '2026-10-28', irregularidade_constatada: true, inspetor: 'INSP-014' }
    ],
    ...overrides
  }
}

function notFoundError() {
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, { status: 404 } as AxiosResponse)
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LossManagementPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const rowOf = () => screen.findByRole('row', { name: /UC100002/ })
const openByClick = async () => fireEvent.click(within(await rowOf()).getByText('Casa Caiada'))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Painel de detalhe da UC', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'gerente_perdas' } } as ReturnType<typeof useAuth>)
    mockedApi.listSuspiciousUnits.mockResolvedValue({ itens: [UNIT], total: 1, avisos: [] })
    mockedApi.getUnitDetail.mockResolvedValue(buildDetail())
    mockedApi.getQueueSummary.mockResolvedValue({
      capacidade_total: 200,
      capacidade_programada: 58,
      selecionadas: 0,
      kwh_mes_selecionadas: 0,
      valor_ano_selecionadas_rs: 0,
      tarifa_rs_kwh: 0.714,
      retorno_esperado_kwh_mes: 0,
      retorno_esperado_valor_ano_rs: 0,
      taxa_acerto: { inspecoes_total: 10, irregularidades_confirmadas: 6, taxa: 0.6, periodo_inicio: null, periodo_fim: null }
    })
    mockedApi.getQueueFilters.mockResolvedValue({ municipios: [], classes: [] })
    mockedApi.listInspections.mockResolvedValue([])
  })

  it('abre ao clicar na linha, com título acessível, motivo e a conta do score com os números', async () => {
    renderPage()
    await openByClick()

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })
    expect(await within(panel).findByText('Casa Caiada, Olinda · Residencial')).toBeInTheDocument()
    expect(within(panel).getByText(/O consumo caiu de 300 para 50/)).toBeInTheDocument()
    expect(within(panel).getByText('5.520 kWh')).toBeInTheDocument()
    expect(within(panel).getByText('× 93%')).toBeInTheDocument()
    expect(within(panel).getByText('= 5.133,6 kWh')).toBeInTheDocument()
    expect(within(panel).getByText('Score 86 de 100')).toBeInTheDocument()
    expect(mockedApi.getUnitDetail).toHaveBeenCalledWith('UC100002', expect.anything())
  })

  it('abre por teclado com Enter na linha e mostra a data no formato brasileiro', async () => {
    renderPage()
    const row = await rowOf()
    expect(row).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(row, { key: 'Enter' })

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })
    expect(await within(panel).findByText('28/10/2026')).toBeInTheDocument()
    expect(within(panel).getByText('INSP-014')).toBeInTheDocument()
    expect(within(panel).getByText('Irregularidade confirmada')).toBeInTheDocument()
  })

  it('não abre o painel ao marcar o checkbox da linha', async () => {
    renderPage()

    fireEvent.click(within(await rowOf()).getByRole('checkbox'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha com Esc', async () => {
    renderPage()
    await openByClick()
    await screen.findByRole('dialog', { name: 'UC100002' })

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'UC100002' })).not.toBeInTheDocument())
  })

  it('mostra o skeleton enquanto o detalhe carrega', async () => {
    mockedApi.getUnitDetail.mockReturnValue(new Promise(() => undefined))
    renderPage()
    await openByClick()

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })

    expect(within(panel).queryByText('Como o score é calculado')).not.toBeInTheDocument()
    expect(within(panel).getByText('Carregando os dados da UC')).toBeInTheDocument()
  })

  it('mostra o erro em português e tenta de novo pelo botão', async () => {
    mockedApi.getUnitDetail.mockRejectedValueOnce(new Error('falha de rede'))
    renderPage()
    await openByClick()

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })
    expect(await within(panel).findByText('Não foi possível carregar o detalhe da UC')).toBeInTheDocument()
    fireEvent.click(within(panel).getByRole('button', { name: 'Tentar novamente' }))

    expect(await within(panel).findByText('Score 86 de 100')).toBeInTheDocument()
    expect(mockedApi.getUnitDetail).toHaveBeenCalledTimes(2)
  })

  it('mostra o estado vazio quando a UC não tem dados (404)', async () => {
    mockedApi.getUnitDetail.mockRejectedValue(notFoundError())
    renderPage()
    await openByClick()

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })

    expect(await within(panel).findByText('Sem dados para esta UC')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })

  it('mostra a mensagem de vazio quando a UC não tem inspeções anteriores', async () => {
    mockedApi.getUnitDetail.mockResolvedValue(buildDetail({ inspecoes_anteriores: [] }))
    renderPage()
    await openByClick()

    expect(await screen.findByText('Nenhuma inspeção anterior para esta UC.')).toBeInTheDocument()
  })

  it('reaproveita o detalhe em cache ao reabrir a mesma UC', async () => {
    renderPage()
    await openByClick()
    await screen.findByText('Score 86 de 100')
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'UC100002' })).not.toBeInTheDocument())

    await openByClick()
    await screen.findByText('Score 86 de 100')

    expect(mockedApi.getUnitDetail).toHaveBeenCalledTimes(1)
  })

  it('gerente de perdas gera a ordem desta UC pelo fluxo de confirmação existente', async () => {
    renderPage()
    await openByClick()

    fireEvent.click(await screen.findByRole('button', { name: 'Gerar ordem desta UC' }))

    expect(await screen.findByRole('dialog', { name: 'Gerar 1 ordem de inspeção' })).toBeInTheDocument()
  })

  it('desliga o botão de gerar ordem quando a UC já tem ordem', async () => {
    mockedApi.getUnitDetail.mockResolvedValue(buildDetail({ situacao: 'ordem_gerada' }))
    renderPage()
    await openByClick()

    expect(await screen.findByRole('button', { name: 'Gerar ordem desta UC' })).toBeDisabled()
  })

  it('diretor abre o painel, mas não vê o botão de gerar ordem', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'diretor' } } as ReturnType<typeof useAuth>)
    renderPage()
    await openByClick()

    const panel = await screen.findByRole('dialog', { name: 'UC100002' })

    expect(await within(panel).findByText('Score 86 de 100')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Gerar ordem desta UC' })).not.toBeInTheDocument()
  })
})
