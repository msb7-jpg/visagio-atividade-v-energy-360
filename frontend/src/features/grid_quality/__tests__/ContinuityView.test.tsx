import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { ContinuityView } from '@/features/grid_quality/components/ContinuityView'
import { continuityDataset } from '@/features/grid_quality/mocks/continuityMock'
import { buildContinuitySnapshot } from '@/features/grid_quality/utils/continuityAggregations'

beforeAll(() => {
  // Recharts mede o contêiner com ResizeObserver, ausente no jsdom.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContinuityView />
    </QueryClientProvider>
  )
}

describe('buildContinuitySnapshot', () => {
  const all = { includeEventMonth: true, municipality: '' }

  it('pondera DEC pelas UCs atendidas e compara B com A', () => {
    const { kpis } = buildContinuitySnapshot(continuityDataset, all)
    // (12*2000 + 10*1000 + 8*800 + 2*600 + 2*400 + 40*20) / 4820
    expect(kpis.dec.current).toBeCloseTo(43_200 / 4820, 3)
    expect(kpis.dec.changePercent).toBeGreaterThan(0)
  })

  it('exclui o mês do evento do período B e filtra por município', () => {
    const withoutEvent = buildContinuitySnapshot(continuityDataset, { includeEventMonth: false, municipality: '' })
    const withEvent = buildContinuitySnapshot(continuityDataset, all)
    expect(withoutEvent.kpis.interruptions.current).toBeLessThan(withEvent.kpis.interruptions.current)
    const olinda = buildContinuitySnapshot(continuityDataset, { includeEventMonth: true, municipality: 'Olinda' })
    expect(olinda.feeders.map((feeder) => feeder.id_alimentador)).toEqual(['ALM-OLI-006'])
  })
})

describe('ContinuityView', () => {
  it('avisa que os dados são de exemplo e mostra os cards e o evento', async () => {
    renderView()
    expect(screen.getByText(/Dados de exemplo, aguardando a Gold da Fatia 02/)).toBeInTheDocument()
    expect(await screen.findByText('DEC simplificado (h por UC)')).toBeInTheDocument()
    expect(screen.getByText('Nº de interrupções')).toBeInTheDocument()
    expect(screen.getByText('Evento fora do padrão')).toBeInTheDocument()
  })

  it('mostra o mapa e o DEC por município', async () => {
    renderView()
    expect(await screen.findByText('Onde estão as piores interrupções')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Mapa esquemático do DEC por município' })).toBeInTheDocument()
    expect(screen.getByText('DEC por município (h), período B')).toBeInTheDocument()
    expect(within(screen.getByRole('list')).getByText('São Lourenço da Mata')).toBeInTheDocument()
  })

  it('ordena os alimentadores por UC-horas e marca amostra pequena', async () => {
    renderView()
    const rows = await screen.findAllByRole('row')
    expect(within(rows[1]).getByText('ALM-REC-008')).toBeInTheDocument()
    expect(within(rows[1]).getByText('24.000')).toBeInTheDocument()
    expect(screen.getByText('amostra pequena')).toBeInTheDocument()
  })

  it('recalcula ao excluir o mês do evento', async () => {
    renderView()
    await screen.findByText('Evento fora do padrão')
    fireEvent.click(screen.getByRole('tab', { name: 'Excluir' }))
    expect(await screen.findByRole('tab', { name: 'Excluir', selected: true })).toBeInTheDocument()
  })
})
