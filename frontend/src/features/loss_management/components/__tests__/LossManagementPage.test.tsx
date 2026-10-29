import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import type {
  InspectionOrder,
  QueueSummary,
  QueueWarning,
  SuspiciousQueue,
  SuspiciousUnit
} from '@/features/loss_management/types/lossTypes'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'gerente_perdas' } })
}))

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: {
    listSuspiciousUnits: vi.fn(),
    getQueueSummary: vi.fn(),
    getQueueFilters: vi.fn(),
    listInspections: vi.fn(),
    listInspectors: vi.fn(),
    createInspection: vi.fn(),
    updateInspection: vi.fn()
  }
}))

const mockedApi = vi.mocked(lossApi)

const suspiciousUnit: SuspiciousUnit = {
  id_uc: 'UC104779',
  municipio: 'Recife',
  bairro: 'Várzea',
  classe_consumo: 'Industrial',
  motivos: ['queda_subita'],
  score_risco: 56.7,
  score: 100,
  situacao: 'na_fila',
  probabilidade_acerto: 0.93,
  meses_base: 12,
  consumo_base_kwh: 10544.8,
  consumo_recente_kwh: 3069.3,
  kwh_estimado_recuperar: 22426.2,
  valor_estimado_recuperar_rs: 19062.27,
  kwh_mes_recuperavel: 7475.5,
  valor_ano_rs: 64047.1
}

const summaryFixture: QueueSummary = {
  capacidade_total: 200,
  capacidade_programada: 0,
  selecionadas: 0,
  kwh_mes_selecionadas: 0,
  valor_ano_selecionadas_rs: 0,
  tarifa_rs_kwh: 0.7876,
  tarifa_periodo_inicio: '2025-07',
  tarifa_periodo_fim: '2026-06',
  retorno_esperado_kwh_mes: 0,
  retorno_esperado_valor_ano_rs: 0,
  taxa_acerto: { inspecoes_total: null, irregularidades_confirmadas: null, taxa: 0.627, periodo_inicio: null, periodo_fim: null }
}

function buildQueue(itens: SuspiciousUnit[], avisos: QueueWarning[] = []): SuspiciousQueue {
  return { itens, total: itens.length, avisos }
}

function buildOrder(overrides: Partial<InspectionOrder>): InspectionOrder {
  return {
    id_inspecao: 1,
    id_uc: 'UC104779',
    status: 'gerada',
    motivo: 'Queda súbita',
    kwh_estimado: 22426.2,
    fiscal_responsavel: null,
    irregularidade_constatada: null,
    tipo_irregularidade: null,
    kwh_recuperado: null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'perdas@venergy.com',
    criado_em: '2026-10-20T12:00:00Z',
    atualizado_em: '2026-10-20T12:00:00Z',
    ...overrides
  }
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

async function openOrdersTab() {
  fireEvent.click(screen.getByRole('tab', { name: /Ordens de inspeção/ }))
  return screen.findByRole('region', { name: 'Ordens de inspeção' })
}

describe('LossManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([suspiciousUnit]))
    mockedApi.getQueueSummary.mockResolvedValue(summaryFixture)
    mockedApi.getQueueFilters.mockResolvedValue({ municipios: [], classes: [] })
    mockedApi.listInspections.mockResolvedValue([])
    mockedApi.listInspectors.mockResolvedValue([{ codigo: 'INSP-007' }, { codigo: 'INSP-014' }])
    mockedApi.createInspection.mockResolvedValue(buildOrder({}))
    mockedApi.updateInspection.mockResolvedValue(buildOrder({}))
  })

  it('só permite exportar quando há ordem gerada ou em campo', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'concluida', irregularidade_constatada: true })])
    renderPage()
    await openOrdersTab()

    expect(screen.getByRole('button', { name: /Exportar planilha de campo/ })).toBeDisabled()
  })

  it('habilita a exportação quando há ordem pendente em campo', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'pendente' })])
    renderPage()
    await openOrdersTab()

    expect(screen.getByRole('button', { name: /Exportar planilha de campo/ })).toBeEnabled()
  })

  it('envia ordem gerada para campo com o inspetor escolhido na lista', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'gerada' })])
    renderPage()
    const board = await openOrdersTab()

    fireEvent.click(within(board).getByRole('button', { name: /^Enviar a campo OI-/ }))
    await screen.findByRole('option', { name: 'INSP-014' })
    fireEvent.change(screen.getByLabelText('Inspetor'), { target: { value: 'INSP-014' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    await waitFor(() => expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, {
      status: 'pendente', inspetor: 'INSP-014'
    }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('OI-2026-0001 enviada a campo com INSP-014.'))
  })

  it('move a ordem para Concluída com inspetor e data, sem recarregar a página, depois de salvar o resultado', async () => {
    const concludedOrder = buildOrder({
      status: 'concluida', irregularidade_constatada: false, inspetor: 'INSP-007', data_inspecao: '2026-10-27'
    })
    mockedApi.listInspections.mockResolvedValueOnce([buildOrder({ status: 'pendente' })])
    mockedApi.listInspections.mockResolvedValue([concludedOrder])
    renderPage()
    const board = await openOrdersTab()

    fireEvent.click(within(board).getByRole('button', { name: /^Registrar resultado OI-/ }))
    await screen.findByRole('option', { name: 'INSP-007' })
    fireEvent.change(screen.getByLabelText(/^Inspetor/), { target: { value: 'INSP-007' } })
    fireEvent.change(screen.getByLabelText(/Data da inspeção/), { target: { value: '2026-10-27' } })
    fireEvent.change(screen.getByLabelText(/Irregularidade constatada\?/), { target: { value: 'nao' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    const concludedColumn = await screen.findByRole('region', { name: 'Concluída (1)' })
    expect(within(concludedColumn).getByText('INSP-007')).toBeInTheDocument()
    expect(within(concludedColumn).getByText('Inspeção em 27/10/2026')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Em campo (0)' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

})

function buildApiError(status: number, detail: string): AxiosError {
  const response = { status, statusText: '', headers: {}, config: {}, data: { detail } } as AxiosResponse
  return new AxiosError(detail, String(status), undefined, undefined, response)
}

async function openCancelDialog() {
  mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'pendente' })])
  renderPage()
  const board = await openOrdersTab()
  fireEvent.click(within(board).getByRole('button', { name: /^Cancelar OI-/ }))
  fireEvent.change(await screen.findByLabelText(/^Motivo do cancelamento/), { target: { value: 'cliente_regularizou' } })
  return screen.getByRole('button', { name: 'Confirmar cancelamento' })
}

describe('LossManagementPage - erros e estados de envio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([suspiciousUnit]))
    mockedApi.getQueueSummary.mockResolvedValue(summaryFixture)
    mockedApi.getQueueFilters.mockResolvedValue({ municipios: [], classes: [] })
    mockedApi.listInspections.mockResolvedValue([])
  })

  it('mostra a mensagem da API quando o cancelamento é recusado', async () => {
    const conflictDetail = "Transição de status inválida: 'concluida' -> 'cancelada'."
    mockedApi.updateInspection.mockRejectedValue(buildApiError(409, conflictDetail))
    const confirmButton = await openCancelDialog()

    fireEvent.click(confirmButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(conflictDetail)
  })

  it('sinaliza o envio em andamento no cancelamento', async () => {
    mockedApi.updateInspection.mockReturnValue(new Promise(() => undefined))
    const confirmButton = await openCancelDialog()

    fireEvent.click(confirmButton)

    await waitFor(() => expect(confirmButton).toHaveAttribute('aria-busy', 'true'))
    expect(confirmButton).toBeDisabled()
  })

  it('explica a falha das ordens sem citar as tabelas Gold', async () => {
    mockedApi.listInspections.mockRejectedValue(buildApiError(500, 'Erro interno'))
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /Ordens de inspeção/ }))

    expect(await screen.findByText('Não foi possível carregar as ordens')).toBeInTheDocument()
    expect(screen.queryByText(/Gold/)).not.toBeInTheDocument()
  })
})
