import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContinuityView } from '@/features/grid_quality/components/ContinuityView'
import type { ContinuitySnapshot } from '@/features/grid_quality/types/continuityTypes'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

const mockedGet = vi.mocked(apiClient.get)

// Valores fictícios e redondos no formato da API; não representam dados do case.
const comparison = { current: 4, previous: 2, changePercent: 100 }
const snapshot: ContinuitySnapshot = {
  kpis: { dec: comparison, fec: comparison, interruptions: comparison, averageDurationHours: comparison },
  event: {
    competencia: '2001-06',
    eventInterruptions: 1200,
    otherMonthsMedian: 100,
    decWithoutEvent: 2,
    fecWithoutEvent: 1,
    extremeInScope: true
  },
  municipalities: [
    { name: 'Olinda', latitude: -8.01, longitude: -34.85, decHours: 12 },
    { name: 'Recife', latitude: -8.05, longitude: -34.9, decHours: 3 }
  ],
  feeders: [
    {
      id_alimentador: 'ALIM-TESTE-01',
      municipality: 'Olinda',
      ucsServed: 40,
      decHours: 6,
      fecTimes: 3,
      interruptions: 120,
      ucHours: 24_000,
      networkSharePercent: 60,
      decPreviousHours: 2,
      smallSample: true
    }
  ],
  causes: [
    { cause: 'CLIMATICA', sharePercent: 60, actionable: false },
    { cause: 'VEGETACAO', sharePercent: 30, actionable: true },
    { cause: 'Sem causa registrada', sharePercent: 10, actionable: false }
  ],
  types: [{ type: 'OSCILACAO', sharePercent: 100 }]
}

beforeAll(() => {
  // Recharts mede o contêiner com ResizeObserver, ausente no jsdom.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockResolvedValue({ data: snapshot })
})

async function openFilters() {
  fireEvent.click(await screen.findByRole('button', { name: 'Filtros' }))
}

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContinuityView />
    </QueryClientProvider>
  )
}

describe('ContinuityView', () => {
  it('consulta a API sem município e com o mês do evento incluído', async () => {
    renderView()
    expect(await screen.findByText('DEC simplificado (h por UC)')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('/quality/continuity', {
      params: { municipio: undefined, incluir_evento: true },
      signal: expect.anything()
    })
    expect(screen.queryByText(/Dados de exemplo/)).not.toBeInTheDocument()
  })

  it('refaz a chamada ao clicar em "Tentar novamente" quando a Continuidade falha', async () => {
    mockedGet.mockRejectedValueOnce(new Error('falha'))
    renderView()
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nº de interrupções')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('mostra KPIs, o cartão do evento e o rótulo do mês detectado', async () => {
    renderView()
    expect(await screen.findByText('Nº de interrupções')).toBeInTheDocument()
    expect(screen.getByText('Evento fora do padrão')).toBeInTheDocument()
    await openFilters()
    expect(screen.getByText('Mês do evento (06/2001)')).toBeInTheDocument()
  })

  it('omite o cartão do evento quando a API devolve event nulo', async () => {
    mockedGet.mockResolvedValue({ data: { ...snapshot, event: null } })
    renderView()
    expect(await screen.findByText('Nº de interrupções')).toBeInTheDocument()
    expect(screen.queryByText('Evento fora do padrão')).not.toBeInTheDocument()
  })

  it('mostra o mapa e o DEC por município', async () => {
    renderView()
    expect(await screen.findByText('Onde estão as piores interrupções')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Mapa esquemático do DEC por município' })).toBeInTheDocument()
    expect(within(screen.getAllByRole('list')[0]).getByText('Olinda')).toBeInTheDocument()
  })

  it('mostra os alimentadores por UC-horas e marca amostra pequena', async () => {
    renderView()
    const rows = await screen.findAllByRole('row')
    expect(within(rows[1]).getByText('ALIM-TESTE-01')).toBeInTheDocument()
    expect(within(rows[1]).getByText('24.000')).toBeInTheDocument()
    expect(screen.getByText('amostra pequena')).toBeInTheDocument()
  })

  it('mostra causas com "Sem causa registrada" e tipos de ocorrência', async () => {
    renderView()
    expect(await screen.findByText('Interrupções por causa')).toBeInTheDocument()
    expect(screen.getAllByText('Sem causa registrada')).toHaveLength(1)
    expect(screen.getAllByText('Climática')).toHaveLength(1)
    expect(screen.getByText('Oscilação')).toBeInTheDocument()
    expect(screen.getByText('Por tipo de ocorrência')).toBeInTheDocument()
  })

  it('refaz a consulta ao excluir o mês do evento e ao escolher um município', async () => {
    renderView()
    await screen.findByText('Evento fora do padrão')
    await openFilters()
    fireEvent.click(screen.getByRole('tab', { name: 'Excluir' }))
    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith('/quality/continuity', {
        params: { municipio: undefined, incluir_evento: false },
        signal: expect.anything()
      })
    )
    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'Olinda' } })
    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith('/quality/continuity', {
        params: { municipio: 'Olinda', incluir_evento: false },
        signal: expect.anything()
      })
    )
  })

  it('lista os 14 municípios no filtro, sem depender do snapshot filtrado', async () => {
    renderView()
    await screen.findByText('Evento fora do padrão')
    await openFilters()
    expect(within(screen.getByLabelText('Município')).getAllByRole('option')).toHaveLength(15)
  })

  it('lista "Todas" e as causas do snapshot, filtra por causa e volta para "Todas"', async () => {
    renderView()
    await screen.findByText('Evento fora do padrão')
    await openFilters()
    const select = screen.getByLabelText('Causa')
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Todas',
      'Climática',
      'Vegetação',
      'Sem causa registrada'
    ])
    fireEvent.change(select, { target: { value: 'VEGETACAO' } })
    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith('/quality/continuity', {
        params: { municipio: undefined, causa: 'VEGETACAO', incluir_evento: true },
        signal: expect.anything()
      })
    )
    fireEvent.change(select, { target: { value: '' } })
    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith('/quality/continuity', {
        params: { municipio: undefined, causa: undefined, incluir_evento: true },
        signal: expect.anything()
      })
    )
  })

  it('mostra chips dos filtros ativos e "Limpar filtros" volta ao padrão', async () => {
    renderView()
    await screen.findByText('Evento fora do padrão')
    await openFilters()
    fireEvent.click(screen.getByRole('tab', { name: 'Excluir' }))
    fireEvent.change(screen.getByLabelText('Município'), { target: { value: 'Olinda' } })
    fireEvent.change(screen.getByLabelText('Causa'), { target: { value: 'VEGETACAO' } })
    expect(await screen.findByText('Município: Olinda')).toBeInTheDocument()
    expect(screen.getByText('Causa: Vegetação')).toBeInTheDocument()
    expect(screen.getByText('Sem o mês do evento (06/2001)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith('/quality/continuity', {
        params: { municipio: undefined, causa: undefined, incluir_evento: true },
        signal: expect.anything()
      })
    )
    expect(screen.queryByText('Município: Olinda')).not.toBeInTheDocument()
  })

  it('usa texto neutro no cartão quando o mês não é extremo para a causa e evita divisão por mediana zero', async () => {
    mockedGet.mockResolvedValue({
      data: { ...snapshot, event: { ...snapshot.event!, extremeInScope: false, otherMonthsMedian: 0 } }
    })
    renderView()
    await screen.findByText('Evento fora do padrão')
    await openFilters()
    fireEvent.change(screen.getByLabelText('Causa'), { target: { value: 'VEGETACAO' } })
    expect(await screen.findByText('Mês do evento na rede')).toBeInTheDocument()
    expect(screen.getByText(/os outros meses não tiveram ocorrências/)).toBeInTheDocument()
    expect(screen.queryByText(/vezes a mediana/)).not.toBeInTheDocument()
  })

  it('mostra erro quando a API falha', async () => {
    mockedGet.mockRejectedValue(new Error('falha'))
    renderView()
    expect(await screen.findByText('Não foi possível carregar a Continuidade')).toBeInTheDocument()
  })
})
