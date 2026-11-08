import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { ExcludedQueueTab } from '@/features/loss_management/components/ExcludedQueueTab'
import type { ExcludedQueue, ExcludedUnit } from '@/features/loss_management/types/excludedTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({ lossApi: { listExcludedUnits: vi.fn() } }))

const mockedApi = vi.mocked(lossApi)

const GD_UNIT: ExcludedUnit = {
  id_uc: 'UC100018',
  municipio: 'PAULISTA',
  bairro: 'FRAGOSO',
  classe_consumo: 'RESIDENCIAL',
  motivo_exclusao: 'possui_gd',
  data_evento: null,
  volta_a_ser_avaliada: null
}
const INSPECTED_UNIT: ExcludedUnit = {
  ...GD_UNIT,
  id_uc: 'UC100046',
  motivo_exclusao: 'inspecionada_sem_achado',
  data_evento: '2025-08-10',
  volta_a_ser_avaliada: '2026-11-01'
}

function queue(units: ExcludedUnit[]): ExcludedQueue {
  return {
    itens: units,
    total: units.length,
    resumo: [
      { motivo: 'possui_gd', total: 1 },
      { motivo: 'inspecionada_sem_achado', total: 1 }
    ]
  }
}

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ExcludedQueueTab />
    </QueryClientProvider>
  )
}

describe('ExcludedQueueTab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra motivo, detalhe e a data em que a UC volta a ser avaliada', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue(queue([GD_UNIT, INSPECTED_UNIT]))

    renderTab()

    expect(await screen.findByText('UC100046')).toBeInTheDocument()
    expect(screen.getByText('Inspeção em 10/08/2025')).toBeInTheDocument()
    expect(screen.getByText('01/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 2 de 2 UCs')).toBeInTheDocument()
  })

  it('põe a tabela e o rodapé num cartão, como a lista da fila priorizada, e os filtros fora dele', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue(queue([GD_UNIT, INSPECTED_UNIT]))

    renderTab()

    const table = await screen.findByRole('table')
    const card = table.closest('.glass-panel')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('p-4')
    expect(card).toContainElement(screen.getByText('Mostrando 2 de 2 UCs'))
    expect(card).not.toContainElement(screen.getByRole('group', { name: 'Filtrar por motivo da exclusão' }))
  })

  it('mostra o estado vazio dentro do cartão', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue({ itens: [], total: 0, resumo: [] })

    renderTab()

    const emptyTitle = await screen.findByText('Nenhuma UC fora da fila')
    expect(emptyTitle.closest('.glass-panel')).not.toBeNull()
  })

  it('não inventa data de volta para a UC com geração distribuída', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue(queue([GD_UNIT]))

    renderTab()

    expect(await screen.findByText('UC100018')).toBeInTheDocument()
    expect(screen.getByText('—', { selector: 'td' })).toBeInTheDocument()
  })

  it('filtra pelo motivo escolhido no resumo', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue(queue([GD_UNIT, INSPECTED_UNIT]))
    renderTab()
    await screen.findByText('UC100046')

    fireEvent.click(screen.getByRole('button', { name: /Possui geração distribuída \(1\)/ }))

    await waitFor(() =>
      expect(mockedApi.listExcludedUnits).toHaveBeenCalledWith({ motivo: 'possui_gd' }, expect.anything())
    )
  })

  it('oferece nova tentativa quando a API falha', async () => {
    mockedApi.listExcludedUnits.mockRejectedValueOnce(new Error('falha'))
    mockedApi.listExcludedUnits.mockResolvedValue(queue([GD_UNIT]))
    renderTab()

    fireEvent.click(await screen.findByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('UC100018')).toBeInTheDocument()
  })

  it('explica o estado vazio', async () => {
    mockedApi.listExcludedUnits.mockResolvedValue({ itens: [], total: 0, resumo: [] })

    renderTab()

    expect(await screen.findByText('Nenhuma UC fora da fila')).toBeInTheDocument()
  })
})
