import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { OrderHistorySheet } from '@/features/loss_management/components/OrderHistorySheet'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import type { OrderEvent } from '@/features/loss_management/types/orderEventTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({ lossApi: { listOrderEvents: vi.fn() } }))

const mockedApi = vi.mocked(lossApi)

const ORDER = { id_inspecao: 7, id_uc: 'UC131844', criado_em: '2026-11-06T15:00:00' } as InspectionOrder

const EVENTS: OrderEvent[] = [
  {
    id_evento: 1,
    id_inspecao: 7,
    tipo: 'gerada',
    status_anterior: null,
    status_novo: 'gerada',
    autor: 'perdas@venergy.com',
    alteracoes: {},
    criado_em: '2026-11-06T15:00:00'
  },
  {
    id_evento: 2,
    id_inspecao: 7,
    tipo: 'resultado_importado',
    status_anterior: 'pendente',
    status_novo: 'concluida',
    autor: 'perdas@venergy.com',
    alteracoes: {
      status: ['pendente', 'concluida'],
      data_inspecao: [null, '2026-11-05'],
      irregularidade_constatada: [null, true],
      kwh_recuperado: [null, 1250.5]
    },
    criado_em: '2026-11-06T16:30:00'
  }
]

function renderSheet(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <OrderHistorySheet order={ORDER} onClose={onClose} />
    </QueryClientProvider>
  )
  return onClose
}

describe('OrderHistorySheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra cada passo com autor, data no fuso de Brasília e os valores antes e depois', async () => {
    mockedApi.listOrderEvents.mockResolvedValue(EVENTS)

    renderSheet()

    expect(await screen.findByText('Ordem gerada')).toBeInTheDocument()
    expect(screen.getByText('Resultado importado da planilha')).toBeInTheDocument()
    expect(screen.getByText('06/11/2026 12:00')).toBeInTheDocument()
    expect(screen.getByText('Status: pendente → concluida')).toBeInTheDocument()
    expect(screen.getByText('Data da inspeção: — → 05/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Irregularidade constatada: — → Sim')).toBeInTheDocument()
    expect(screen.getByText('Energia recuperada (kWh): — → 1.250,5')).toBeInTheDocument()
    expect(screen.getAllByText('Por perdas@venergy.com')).toHaveLength(2)
  })

  it('põe cada registro num contêiner próprio, com autor, data e mudanças juntos', async () => {
    mockedApi.listOrderEvents.mockResolvedValue(EVENTS)

    renderSheet()

    const generated = (await screen.findByText('Ordem gerada')).closest('.glass-panel')
    const imported = screen.getByText('Resultado importado da planilha').closest('.glass-panel')
    expect(generated).not.toBeNull()
    expect(imported).not.toBeNull()
    expect(imported).not.toBe(generated)
    expect(imported?.closest('li')).not.toBeNull()
    expect(generated).toContainElement(screen.getByText('06/11/2026 12:00'))
    expect(imported).toContainElement(screen.getByText('06/11/2026 13:30'))
    expect(imported).not.toContainElement(screen.getByText('06/11/2026 12:00'))
    expect(imported).toContainElement(screen.getByText('Status: pendente → concluida'))
    expect(imported).toContainElement(screen.getByText('Energia recuperada (kWh): — → 1.250,5'))
    expect(generated).not.toContainElement(screen.getByText('Status: pendente → concluida'))
  })

  it('não inventa histórico para ordem sem registros', async () => {
    mockedApi.listOrderEvents.mockResolvedValue([])

    renderSheet()

    expect(await screen.findByText('Nenhum registro para esta ordem')).toBeInTheDocument()
  })

  it('oferece nova tentativa quando a API falha', async () => {
    mockedApi.listOrderEvents.mockRejectedValueOnce(new Error('falha'))
    mockedApi.listOrderEvents.mockResolvedValue(EVENTS)
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('Ordem gerada')).toBeInTheDocument()
  })
})
