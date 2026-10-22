import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import type {
  InspectionOrder,
  QueueWarning,
  SuspiciousQueue,
  SuspiciousUnit
} from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: {
    listSuspiciousUnits: vi.fn(),
    listInspections: vi.fn(),
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
  consumo_base_kwh: 10544.8,
  consumo_recente_kwh: 3069.3,
  kwh_estimado_recuperar: 22426.2,
  valor_estimado_recuperar_rs: 19062.27
}

const fieldHistoryWarning: QueueWarning = {
  codigo: 'historico_campo_nao_aplicado',
  mensagem: 'Mensagem de aviso enviada pela API.'
}

function buildQueue(itens: SuspiciousUnit[], avisos: QueueWarning[] = []): SuspiciousQueue {
  return { itens, avisos }
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
  fireEvent.click(screen.getByRole('tab', { name: /Ordens em Campo/ }))
  return screen.findByRole('table', { name: 'Ordens de inspeção' })
}

describe('LossManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([suspiciousUnit]))
    mockedApi.listInspections.mockResolvedValue([])
    mockedApi.createInspection.mockResolvedValue(buildOrder({}))
    mockedApi.updateInspection.mockResolvedValue(buildOrder({}))
  })

  it('mostra a fila priorizada com motivo e energia a recuperar', async () => {
    renderPage()

    const row = await screen.findByRole('row', { name: /UC104779/ })

    expect(within(row).getByText('Queda súbita')).toBeInTheDocument()
    expect(within(row).getByText(/22\.426,2 kWh/)).toBeInTheDocument()
  })

  it('explica quando a fila está vazia', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([]))
    renderPage()

    expect(await screen.findByText('Nenhuma UC suspeita na fila')).toBeInTheDocument()
  })

  it('avisa que o histórico de campo não foi aplicado sem esconder a fila', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([suspiciousUnit], [fieldHistoryWarning]))
    renderPage()

    const warning = await screen.findByRole('status')

    expect(within(warning).getByText('Histórico de inspeções de campo não aplicado.')).toBeInTheDocument()
    expect(within(warning).getByText('Mensagem de aviso enviada pela API.')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /UC104779/ })).toBeInTheDocument()
  })

  it('mantém o aviso visível enquanto um novo filtro é carregado', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValueOnce(buildQueue([suspiciousUnit], [fieldHistoryWarning]))
    mockedApi.listSuspiciousUnits.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    await screen.findByText('Histórico de inspeções de campo não aplicado.')

    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Várzea' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => expect(mockedApi.listSuspiciousUnits).toHaveBeenCalledTimes(2))

    expect(screen.getByText('Histórico de inspeções de campo não aplicado.')).toBeInTheDocument()
  })

  it('mantém o aviso acima do estado vazio da fila', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([], [fieldHistoryWarning]))
    renderPage()

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma UC suspeita na fila')).toBeInTheDocument()
  })

  it('não mostra aviso quando o histórico de campo foi aplicado', async () => {
    renderPage()
    await screen.findByRole('row', { name: /UC104779/ })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('aplica o filtro por bairro', async () => {
    renderPage()
    await screen.findByRole('row', { name: /UC104779/ })

    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Várzea' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => expect(mockedApi.listSuspiciousUnits).toHaveBeenLastCalledWith(
      expect.objectContaining({ bairro: 'Várzea' }), expect.anything()
    ))
  })

  it('gera ordem de inspeção a partir da fila', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Gerar ordem para UC104779' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar ordem' }))

    await waitFor(() => expect(mockedApi.createInspection).toHaveBeenCalledWith({
      id_uc: 'UC104779', motivo: 'Queda súbita'
    }))
  })

  it('envia ordem gerada para campo com o fiscal responsável', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'gerada' })])
    renderPage()
    const table = await openOrdersTab()

    fireEvent.click(within(table).getByRole('button', { name: 'Enviar para campo' }))
    fireEvent.change(await screen.findByLabelText('Fiscal responsável'), { target: { value: 'Equipe 3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    await waitFor(() => expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, {
      status: 'pendente', fiscal_responsavel: 'Equipe 3'
    }))
  })

  it('registra o resultado de campo de uma ordem pendente', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'pendente' })])
    renderPage()
    const table = await openOrdersTab()

    fireEvent.click(within(table).getByRole('button', { name: 'Registrar resultado' }))
    fireEvent.change(await screen.findByLabelText(/Irregularidade constatada\?/), { target: { value: 'sim' } })
    fireEvent.change(screen.getByLabelText('kWh recuperado'), { target: { value: '680' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    await waitFor(() => expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, expect.objectContaining({
      status: 'concluida', irregularidade_constatada: true, kwh_recuperado: 680
    })))
  })

  it('exige justificativa para cancelar uma ordem', async () => {
    mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'pendente' })])
    renderPage()
    const table = await openOrdersTab()

    fireEvent.click(within(table).getByRole('button', { name: 'Cancelar ordem' }))
    const confirmButton = await screen.findByRole('button', { name: 'Confirmar cancelamento' })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/^Justificativa/), { target: { value: 'Cliente regularizou' } })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, {
      status: 'cancelada', justificativa_cancelamento: 'Cliente regularizou'
    }))
  })
})

function buildApiError(status: number, detail: string): AxiosError {
  const response = { status, statusText: '', headers: {}, config: {}, data: { detail } } as AxiosResponse
  return new AxiosError(detail, String(status), undefined, undefined, response)
}

async function openCancelDialog() {
  mockedApi.listInspections.mockResolvedValue([buildOrder({ status: 'pendente' })])
  renderPage()
  const table = await openOrdersTab()
  fireEvent.click(within(table).getByRole('button', { name: 'Cancelar ordem' }))
  fireEvent.change(await screen.findByLabelText(/^Justificativa/), { target: { value: 'Cliente regularizou' } })
  return screen.getByRole('button', { name: 'Confirmar cancelamento' })
}

describe('LossManagementPage - erros e estados de envio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([suspiciousUnit]))
    mockedApi.listInspections.mockResolvedValue([])
  })

  it('mostra a mensagem da API quando a UC já tem ordem ativa', async () => {
    const conflictDetail = 'A UC UC104779 já possui ordem de inspeção ativa.'
    mockedApi.createInspection.mockRejectedValue(buildApiError(409, conflictDetail))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Gerar ordem para UC104779' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar ordem' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(conflictDetail)
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

  it('não refaz a consulta ao filtrar com todos os campos vazios', async () => {
    renderPage()
    await screen.findByRole('row', { name: /UC104779/ })

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await screen.findByRole('row', { name: /UC104779/ })

    expect(mockedApi.listSuspiciousUnits).toHaveBeenCalledTimes(1)
  })

  it('explica a falha das ordens sem citar as tabelas Gold', async () => {
    mockedApi.listInspections.mockRejectedValue(buildApiError(500, 'Erro interno'))
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /Ordens em Campo/ }))

    expect(await screen.findByText('Não foi possível carregar as ordens')).toBeInTheDocument()
    expect(screen.queryByText(/Gold/)).not.toBeInTheDocument()
  })
})
