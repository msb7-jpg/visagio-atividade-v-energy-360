import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import type { InspectionOrder, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

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
    mockedApi.listSuspiciousUnits.mockResolvedValue([suspiciousUnit])
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
    mockedApi.listSuspiciousUnits.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Nenhuma UC suspeita na fila')).toBeInTheDocument()
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
      id_uc: 'UC104779', motivo: 'Queda súbita', kwh_estimado: 22426.2
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
