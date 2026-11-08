import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { EffectivenessTab } from '@/features/loss_management/components/EffectivenessTab'
import type { Backtest, BacktestSeries } from '@/features/loss_management/types/backtestTypes'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { getBacktestSeries: vi.fn(), listInspections: vi.fn() }
}))

const mockedApi = vi.mocked(lossApi)

const JULY: Backtest = {
  backtest_executado: true,
  cortes_disponiveis: ['2025-07', '2025-08'],
  data_corte: '2025-07',
  janela_resultado_inicio: '2025-08-01',
  janela_resultado_fim: '2025-10-31',
  n_solicitado: 200,
  n_selecionadas: 200,
  n_inspecionadas: 121,
  n_irregulares: 114,
  precisao_selecao: 0.942,
  inspecoes_janela: 833,
  linha_base: 0.649,
  diferenca_pp: 29.3,
  kwh_recuperado: 462953.1,
  por_motivo: [
    { motivo: 'queda_subita', inspecionadas: 97, irregulares: 91, taxa: 0.938, amostra_suficiente: true },
    { motivo: 'queda_moderada', inspecionadas: 4, irregulares: 4, taxa: 1, amostra_suficiente: false }
  ],
  amostra_minima_por_motivo: 10
}

const AUGUST: Backtest = {
  ...JULY,
  data_corte: '2025-08',
  janela_resultado_inicio: '2025-09-01',
  janela_resultado_fim: '2025-11-30',
  n_inspecionadas: 155,
  n_irregulares: 150,
  precisao_selecao: 0.968,
  linha_base: 0.642,
  diferenca_pp: 32.5,
  kwh_recuperado: 571100,
  por_motivo: [{ motivo: 'queda_subita', inspecionadas: 155, irregulares: 150, taxa: 0.968, amostra_suficiente: true }]
}

function seriesOf(...cortes: Backtest[]): BacktestSeries {
  return { tamanho: 200, cortes }
}

let nextOrderId = 1

function buildOrder(status: InspectionOrder['status'], irregular: boolean | null, kwh: number | null): InspectionOrder {
  nextOrderId += 1
  return {
    id_inspecao: nextOrderId,
    id_uc: 'UC1',
    status,
    motivo: null,
    kwh_estimado: 0,
    fiscal_responsavel: null,
    irregularidade_constatada: irregular,
    tipo_irregularidade: null,
    kwh_recuperado: kwh,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'x',
    criado_em: '2026-01-01T00:00:00',
    atualizado_em: '2026-01-01T00:00:00'
  }
}

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <EffectivenessTab />
    </QueryClientProvider>
  )
}

describe('EffectivenessTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listInspections.mockResolvedValue([])
  })

  it('mostra uma linha por corte com precisão, linha de base, diferença, n e energia', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()

    expect(await screen.findByText('94,2%')).toBeInTheDocument()
    expect(screen.getByText('64,9%')).toBeInTheDocument()
    expect(screen.getByText('+29,3 p.p.')).toBeInTheDocument()
    expect(screen.getByText('121 de 200')).toBeInTheDocument()
    expect(screen.getByText('463 MWh')).toBeInTheDocument()
    expect(screen.getByText('96,8%')).toBeInTheDocument()
    expect(screen.getByText('155 de 200')).toBeInTheDocument()
    expect(screen.getByText('571,1 MWh')).toBeInTheDocument()
  })

  it('consulta a série uma única vez, sem pedir corte nem tamanho', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()
    await screen.findByText('94,2%')

    expect(mockedApi.getBacktestSeries).toHaveBeenCalledTimes(1)
    expect(mockedApi.getBacktestSeries).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('destaca na tabela só a linha do corte em detalhe e acompanha a troca de corte', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))
    renderTab()
    await screen.findByText('94,2%')

    const [, julyRow, augustRow] = screen.getAllByRole('row') // a primeira linha é o cabeçalho
    expect(julyRow).toHaveAttribute('aria-current', 'true')
    expect(augustRow).not.toHaveAttribute('aria-current')

    fireEvent.change(screen.getByLabelText('Corte em detalhe'), { target: { value: '2025-08' } })

    await waitFor(() => expect(screen.getAllByRole('row')[2]).toHaveAttribute('aria-current', 'true'))
    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('aria-current')
  })

  it('não mostra zeros como se fossem resultado quando as ordens de campo falham', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))
    mockedApi.listInspections.mockRejectedValue(new Error('falha'))

    renderTab()

    expect(await screen.findByText('Não foi possível carregar os resultados de campo')).toBeInTheDocument()
    expect(screen.queryByText('Ordens concluídas')).not.toBeInTheDocument()
    expect(await screen.findByText('94,2%')).toBeInTheDocument()
  })

  it('detalha por padrão o primeiro corte, o mais antigo', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()

    expect(await screen.findByText('93,8% · n = 97')).toBeInTheDocument()
    expect(screen.getByLabelText('Corte em detalhe')).toHaveValue('2025-07')
  })

  it('troca o detalhe ao escolher outro corte, sem nova consulta', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))
    renderTab()
    await screen.findByText('93,8% · n = 97')

    fireEvent.change(screen.getByLabelText('Corte em detalhe'), { target: { value: '2025-08' } })

    expect(await screen.findByText('96,8% · n = 155')).toBeInTheDocument()
    expect(screen.queryByText('93,8% · n = 97')).not.toBeInTheDocument()
    expect(mockedApi.getBacktestSeries).toHaveBeenCalledTimes(1)
  })

  it('não mostra taxa de um motivo com amostra insuficiente', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))

    renderTab()

    expect(await screen.findByText(/sem inspeções suficientes \(n = 4, mínimo 10\)/)).toBeInTheDocument()
  })

  it('mostra travessão e explica quando a seleção de um corte não teve inspeções', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(
      seriesOf({
        ...JULY,
        n_inspecionadas: 0,
        n_irregulares: 0,
        precisao_selecao: null,
        diferenca_pp: null,
        por_motivo: []
      })
    )

    renderTab()

    expect(await screen.findByText('0 de 200')).toBeInTheDocument()
    const messages = await screen.findAllByText('Sem inspeções suficientes para calcular')
    expect(messages.length).toBeGreaterThan(0)
  })

  it('avisa que a precisão vale só para as UCs inspecionadas e que o histórico foi direcionado', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))

    renderTab()

    expect(await screen.findByText(/Leia a precisão junto com o n/)).toBeInTheDocument()
  })

  it('avisa que o backtest não foi executado quando não há histórico de inspeções', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf())

    renderTab()

    expect(await screen.findByText(/Backtest ainda não executado/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Corte em detalhe')).not.toBeInTheDocument()
  })

  it('calcula os resultados reais de campo só com as ordens concluídas', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))
    mockedApi.listInspections.mockResolvedValue([
      buildOrder('concluida', true, 2000),
      buildOrder('concluida', false, null),
      buildOrder('gerada', null, null)
    ])

    renderTab()

    expect(await screen.findByText('50')).toBeInTheDocument()
    expect(screen.getAllByText('2')).toHaveLength(2) // 2 concluídas e 2 MWh recuperados
  })

  it('oferece nova tentativa quando o backtest falha', async () => {
    mockedApi.getBacktestSeries.mockRejectedValueOnce(new Error('falha'))
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))
    renderTab()

    fireEvent.click(await screen.findByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('94,2%')).toBeInTheDocument()
  })
})
