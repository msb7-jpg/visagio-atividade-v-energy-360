import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  por_motivo: [{ motivo: 'queda_subita', inspecionadas: 97, irregulares: 91, taxa: 0.938, amostra_suficiente: true }],
  amostra_minima_por_motivo: 10,
  kwh_esperado: 145300,
  chance_media_prevista: 0.925,
  irregulares_janela: 541,
  irregulares_na_fila: 517,
  por_faixa: [
    {
      faixa: 'alta',
      selecionadas: 199,
      inspecionadas: 119,
      irregulares: 113,
      taxa: 0.95,
      chance_prevista: 0.925,
      kwh_esperado: 145300,
      kwh_recuperado: 462953.1
    },
    {
      faixa: 'rampa',
      selecionadas: 1,
      inspecionadas: 0,
      irregulares: 0,
      taxa: null,
      chance_prevista: null,
      kwh_esperado: 0,
      kwh_recuperado: 0
    },
    {
      faixa: 'baixa',
      selecionadas: 0,
      inspecionadas: 0,
      irregulares: 0,
      taxa: null,
      chance_prevista: null,
      kwh_esperado: 0,
      kwh_recuperado: 0
    }
  ]
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
  kwh_esperado: 186300,
  irregulares_janela: 544,
  irregulares_na_fila: 522,
  por_faixa: [{ ...JULY.por_faixa[0], inspecionadas: 158, irregulares: 152, taxa: 0.962, kwh_esperado: 186300 }]
}

const JULY_50: Backtest = {
  ...JULY,
  n_solicitado: 50,
  n_selecionadas: 50,
  n_inspecionadas: 33,
  n_irregulares: 32,
  precisao_selecao: 0.97
}

const AUGUST_50: Backtest = {
  ...AUGUST,
  n_solicitado: 50,
  n_selecionadas: 50,
  n_inspecionadas: 40,
  n_irregulares: 39,
  precisao_selecao: 0.975
}

function seriesOf(...cortes: Backtest[]): BacktestSeries {
  return { tamanho: 200, cortes, tamanhos: cortes.length > 0 ? [{ tamanho: 200, cortes }] : [] }
}

/** A série medida em dois tamanhos: N = 50 e o padrão, N = 200. */
function seriesWithSizes(): BacktestSeries {
  return {
    tamanho: 200,
    cortes: [JULY, AUGUST],
    tamanhos: [
      { tamanho: 50, cortes: [JULY_50, AUGUST_50] },
      { tamanho: 200, cortes: [JULY, AUGUST] }
    ]
  }
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

/** As tabelas da aba, em ordem: os cortes, a comparação entre tamanhos e a calibração por faixa. */
const seriesTable = async () => (await screen.findAllByRole('table'))[0]
const sizeTable = () => screen.findByRole('table', { name: /medido em cada tamanho/ })
const bandTable = () => screen.findByRole('table', { name: /Previsto contra realizado/ })

describe('EffectivenessTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listInspections.mockResolvedValue([])
  })

  it('mostra uma linha por corte com precisão, acerto previsto, energia esperada e recuperada, cobertura e n', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()

    const table = within(await seriesTable())
    expect(table.getByText('94,2%')).toBeInTheDocument()
    expect(table.getByText('96,8%')).toBeInTheDocument()
    expect(table.getAllByText('92,5%')).toHaveLength(2) // o acerto previsto dos dois cortes
    expect(table.getByText('145,3 MWh')).toBeInTheDocument()
    expect(table.getByText('463 MWh')).toBeInTheDocument()
    expect(table.getByText('186,3 MWh')).toBeInTheDocument()
    expect(table.getByText('571,1 MWh')).toBeInTheDocument()
    expect(table.getByText('517 de 541')).toBeInTheDocument()
    expect(table.getByText('522 de 544')).toBeInTheDocument()
    expect(table.getByText('121 de 200')).toBeInTheDocument()
    expect(table.getByText('155 de 200')).toBeInTheDocument()
  })

  it('não usa mais a comparação com a linha de base como manchete', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()
    await seriesTable()

    expect(screen.queryByText('Linha de base')).not.toBeInTheDocument()
    expect(screen.queryByText('Diferença')).not.toBeInTheDocument()
    expect(screen.queryByText('+29,3 p.p.')).not.toBeInTheDocument()
  })

  it('mostra no cartão o esperado ao lado do recuperado e a cobertura da fila', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()

    expect(await screen.findByText('Esperado: 145,3 MWh (3,2× o esperado)')).toBeInTheDocument()
    expect(screen.getAllByText('Irregulares na fila')).toHaveLength(2) // a coluna da tabela e o indicador do cartão
    expect(screen.getByText('95,6')).toBeInTheDocument() // 517 de 541 estavam na fila; o StatTile separa o "%"
  })

  it('consulta a série uma única vez, sem pedir corte nem tamanho', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()
    await seriesTable()

    expect(mockedApi.getBacktestSeries).toHaveBeenCalledTimes(1)
    expect(mockedApi.getBacktestSeries).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('destaca na tabela só a linha do corte em detalhe e acompanha a troca de corte', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))
    renderTab()
    await seriesTable()

    const [, julyRow, augustRow] = screen.getAllByRole('row') // a primeira linha é o cabeçalho
    expect(julyRow).toHaveAttribute('aria-current', 'true')
    expect(augustRow).not.toHaveAttribute('aria-current')

    fireEvent.change(screen.getByLabelText('Corte em detalhe'), { target: { value: '2025-08' } })

    await waitFor(() => expect(screen.getAllByRole('row')[2]).toHaveAttribute('aria-current', 'true'))
    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('aria-current')
  })

  it('oferece os tamanhos medidos, começa no padrão e troca os cortes ao escolher outro N', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesWithSizes())
    renderTab()

    const sizeSelect = await screen.findByLabelText('Tamanho da seleção (top N)')
    expect(sizeSelect).toHaveValue('200')
    expect(within(await seriesTable()).getByText('121 de 200')).toBeInTheDocument()

    fireEvent.change(sizeSelect, { target: { value: '50' } })

    await waitFor(async () => expect(within(await seriesTable()).getByText('33 de 50')).toBeInTheDocument())
    expect(within(await seriesTable()).queryByText('121 de 200')).not.toBeInTheDocument()
    expect(mockedApi.getBacktestSeries).toHaveBeenCalledTimes(1)
  })

  it('compara os tamanhos no corte em detalhe: quantas irregularidades cada N captura da janela', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesWithSizes())
    renderTab()

    const sizes = within(await sizeTable())
    expect(sizes.getByText('Top 50')).toBeInTheDocument()
    expect(sizes.getByText('Top 200')).toBeInTheDocument()
    expect(sizes.getByText('32 de 541')).toBeInTheDocument()
    expect(sizes.getByText('114 de 541')).toBeInTheDocument()
  })

  it('acompanha o corte escolhido na comparação entre tamanhos', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesWithSizes())
    renderTab()
    await sizeTable()

    fireEvent.change(screen.getByLabelText('Corte em detalhe'), { target: { value: '2025-08' } })

    await waitFor(async () => expect(within(await sizeTable()).getByText('39 de 544')).toBeInTheDocument())
    expect(within(await sizeTable()).queryByText('32 de 541')).not.toBeInTheDocument()
  })

  it('explica que o N compara com 3 meses de inspeções, então a captura é um piso', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesWithSizes())

    renderTab()

    expect(await screen.findByText(/a captura é um piso/)).toBeInTheDocument()
  })

  it('não mostra zeros como se fossem resultado quando as ordens de campo falham', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))
    mockedApi.listInspections.mockRejectedValue(new Error('falha'))

    renderTab()

    expect(await screen.findByText('Não foi possível carregar os resultados de campo')).toBeInTheDocument()
    expect(screen.queryByText('Ordens concluídas')).not.toBeInTheDocument()
    expect(within(await seriesTable()).getByText('94,2%')).toBeInTheDocument()
  })

  it('detalha por padrão o primeiro corte, o mais antigo, com o previsto contra o realizado por faixa', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))

    renderTab()

    const bands = within(await bandTable())
    expect(bands.getByText('Alta (queda de 30% ou mais além dos pares)')).toBeInTheDocument()
    expect(bands.getByText('119')).toBeInTheDocument() // inspecionadas na faixa alta do corte de julho
    expect(bands.getByText('95%')).toBeInTheDocument() // acerto observado
    expect(screen.getByLabelText('Corte em detalhe')).toHaveValue('2025-07')
  })

  it('troca o detalhe ao escolher outro corte, sem nova consulta', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY, AUGUST))
    renderTab()
    await bandTable()

    fireEvent.change(screen.getByLabelText('Corte em detalhe'), { target: { value: '2025-08' } })

    await waitFor(async () => expect(within(await bandTable()).getByText('158')).toBeInTheDocument())
    expect(within(await bandTable()).queryByText('119')).not.toBeInTheDocument()
    expect(mockedApi.getBacktestSeries).toHaveBeenCalledTimes(1)
  })

  it('deixa em branco a faixa sem inspeções em vez de inventar um resultado', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))

    renderTab()

    const rampRow = within(await bandTable()).getByRole('row', { name: /Rampa/ })
    expect(within(rampRow).getAllByText('—')).toHaveLength(4) // previsto, observado, esperado e recuperado
  })

  it('mostra travessão e explica quando a seleção de um corte não teve inspeções', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(
      seriesOf({
        ...JULY,
        n_inspecionadas: 0,
        n_irregulares: 0,
        precisao_selecao: null,
        diferenca_pp: null,
        chance_media_prevista: null,
        kwh_esperado: 0,
        irregulares_janela: 0,
        irregulares_na_fila: 0,
        por_motivo: [],
        por_faixa: []
      })
    )

    renderTab()

    expect(await screen.findByText('0 de 200')).toBeInTheDocument()
    const messages = await screen.findAllByText('Sem inspeções suficientes para calcular')
    expect(messages.length).toBeGreaterThan(0)
    expect(screen.getByText('Sem decomposição por faixa neste corte.')).toBeInTheDocument()
  })

  it('avisa que a precisão vale só para as UCs inspecionadas e que o histórico foi direcionado', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))

    renderTab()

    expect(await screen.findByText(/Leia a precisão junto com o n/)).toBeInTheDocument()
  })

  it('avisa que a precisão tende a ser otimista e que o verão não foi medido', async () => {
    mockedApi.getBacktestSeries.mockResolvedValue(seriesOf(JULY))

    renderTab()

    expect(await screen.findByText(/a precisão tende a ser otimista/)).toBeInTheDocument()
    expect(screen.getByText(/julho a dezembro de 2025/)).toBeInTheDocument()
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

    expect(within(await seriesTable()).getByText('94,2%')).toBeInTheDocument()
  })
})
