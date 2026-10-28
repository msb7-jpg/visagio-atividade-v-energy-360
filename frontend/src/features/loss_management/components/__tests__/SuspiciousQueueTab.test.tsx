import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import type {
  InspectionOrder,
  QueueSituation,
  QueueSummary,
  QueueWarning,
  SuspiciousQueue,
  SuspiciousUnit
} from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: {
    listSuspiciousUnits: vi.fn(),
    getQueueSummary: vi.fn(),
    getQueueFilters: vi.fn(),
    listInspections: vi.fn(),
    createInspection: vi.fn(),
    exportInspections: vi.fn()
  }
}))

const mockedApi = vi.mocked(lossApi)

function buildUnit(idUc: string, score: number, situacao: QueueSituation = 'na_fila'): SuspiciousUnit {
  return {
    id_uc: idUc,
    municipio: 'Olinda',
    bairro: 'Casa Caiada',
    classe_consumo: 'Residencial',
    motivos: ['queda_subita'],
    score_risco: 60,
    score,
    situacao,
    probabilidade_acerto: 0.93,
    consumo_base_kwh: 300,
    consumo_recente_kwh: 50,
    kwh_estimado_recuperar: 750,
    valor_estimado_recuperar_rs: 535.5,
    kwh_mes_recuperavel: 1840,
    valor_ano_rs: 15800
  }
}

const UNITS = [
  buildUnit('UC100001', 94, 'ordem_gerada'),
  buildUnit('UC100002', 91),
  buildUnit('UC100003', 89),
  buildUnit('UC100004', 85, 'em_campo'),
  buildUnit('UC100005', 83)
]

const baseSummary: QueueSummary = {
  capacidade_total: 200,
  capacidade_programada: 58,
  selecionadas: 0,
  kwh_mes_selecionadas: 0,
  valor_ano_selecionadas_rs: 0,
  tarifa_rs_kwh: 0.714,
  retorno_esperado_kwh_mes: 0,
  taxa_acerto: {
    inspecoes_total: 1389,
    irregularidades_confirmadas: 871,
    taxa: 0.627,
    periodo_inicio: '2025-08',
    periodo_fim: '2025-12'
  }
}

function buildQueue(itens: SuspiciousUnit[], avisos: QueueWarning[] = [], total = 1248): SuspiciousQueue {
  return { itens, total, avisos }
}

function buildOrder(idUc: string): InspectionOrder {
  return {
    id_inspecao: 1,
    id_uc: idUc,
    status: 'gerada',
    motivo: null,
    kwh_estimado: 750,
    fiscal_responsavel: null,
    irregularidade_constatada: null,
    tipo_irregularidade: null,
    kwh_recuperado: null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'perdas@venergy.com',
    criado_em: '2026-10-24T10:00:00Z',
    atualizado_em: '2026-10-24T10:00:00Z'
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

const rowOf = (idUc: string) => screen.findByRole('row', { name: new RegExp(idUc) })

describe('Fila de Inspeção', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue(UNITS))
    mockedApi.getQueueSummary.mockImplementation(async (selectedIds) => ({
      ...baseSummary,
      selecionadas: selectedIds.length,
      kwh_mes_selecionadas: selectedIds.length * 1000,
      retorno_esperado_kwh_mes: selectedIds.length * 627
    }))
    mockedApi.getQueueFilters.mockResolvedValue({ municipios: ['Olinda', 'Recife'], classes: ['Comercial', 'Residencial'] })
    mockedApi.listInspections.mockResolvedValue([buildOrder('UC100001'), buildOrder('UC100004')])
    mockedApi.createInspection.mockImplementation(async ({ id_uc: idUc }) => buildOrder(idUc))
  })

  it('mostra o título e as abas com a contagem da fila e das ordens', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Fila de Inspeção' })).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: /Fila priorizada \(1\.248\)/ })).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: /Ordens de inspeção \(2\)/ })).toBeInTheDocument()
  })

  it('mostra os cartões de capacidade e de taxa de acerto histórica', async () => {
    renderPage()

    expect(await screen.findByText('58')).toBeInTheDocument()
    expect(screen.getByText(/de 200 inspeções/)).toBeInTheDocument()
    expect(screen.getByText('62,7%')).toBeInTheDocument()
    expect(screen.getByText(/871 de 1\.389 inspeções/)).toBeInTheDocument()
  })

  it('lista a UC com score, queda, chance de acerto, kWh por mês, valor por ano e link para a Visão 360', async () => {
    renderPage()

    const row = await rowOf('UC100002')

    expect(within(row).getByRole('link', { name: 'UC100002' })).toHaveAttribute('href', '/customers?uc=UC100002')
    expect(within(row).getByText('91')).toBeInTheDocument()
    expect(within(row).getByText('−83%')).toBeInTheDocument()
    expect(within(row).getByText('93%')).toBeInTheDocument()
    expect(within(row).getByText('1.840')).toBeInTheDocument()
    expect(within(row).getByText('Na fila')).toBeInTheDocument()
  })

  it('mostra a situação das UCs que já têm ordem e não deixa marcá-las', async () => {
    renderPage()

    const generated = await rowOf('UC100001')
    const inField = await rowOf('UC100004')

    expect(within(generated).getByText('Ordem gerada')).toBeInTheDocument()
    expect(within(inField).getByText('Em campo')).toBeInTheDocument()
    expect(within(generated).getByRole('checkbox')).toBeDisabled()
    expect(within(inField).getByRole('checkbox')).toBeDisabled()
  })

  it('atualiza o botão e os cartões conforme as UCs marcadas', async () => {
    renderPage()
    const generateButton = await screen.findByRole('button', { name: /^Gerar 0 ordens/ })
    expect(generateButton).toBeDisabled()

    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(within(await rowOf('UC100003')).getByRole('checkbox'))

    expect(await screen.findByRole('button', { name: 'Gerar 2 ordens' })).toBeEnabled()
    await waitFor(() => expect(mockedApi.getQueueSummary).toHaveBeenLastCalledWith(['UC100002', 'UC100003'], expect.anything()))
    expect(await screen.findByText('60')).toBeInTheDocument()
  })

  it('seleciona o topo da fila pulando as UCs que já têm ordem', async () => {
    renderPage()
    await rowOf('UC100002')

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar top 10 prioritárias' }))

    expect(await screen.findByRole('button', { name: 'Gerar 3 ordens' })).toBeEnabled()
    expect(within(await rowOf('UC100005')).getByRole('checkbox')).toBeChecked()
  })

  it('gera uma ordem por UC marcada depois de confirmar', async () => {
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(within(await rowOf('UC100003')).getByRole('checkbox'))

    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 2 ordens' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar e gerar 2 ordens' }))

    await waitFor(() => expect(mockedApi.createInspection).toHaveBeenCalledTimes(2))
    expect(mockedApi.createInspection).toHaveBeenCalledWith({ id_uc: 'UC100002', motivo: 'Queda abrupta de consumo' })
    expect(mockedApi.createInspection).toHaveBeenCalledWith({ id_uc: 'UC100003', motivo: 'Queda abrupta de consumo' })
  })

  it('informa qual UC falhou sem esconder as que foram geradas', async () => {
    mockedApi.createInspection.mockImplementation(async ({ id_uc: idUc }) => {
      if (idUc === 'UC100003') throw new Error('falha')
      return buildOrder(idUc)
    })
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(within(await rowOf('UC100003')).getByRole('checkbox'))
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 2 ordens' }))
    // Depois do lote a fila é recarregada e a UC que deu certo já aparece com ordem gerada.
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([
      buildUnit('UC100002', 91, 'ordem_gerada'),
      buildUnit('UC100003', 89)
    ]))

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar e gerar 2 ordens' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('UC100003')
    expect(alert).toHaveTextContent(/1 de 2 ordens/)
    await waitFor(() => expect(mockedApi.listSuspiciousUnits).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('dialog')).toHaveTextContent('Gerar 2 ordens de inspeção')
  })

  it('não deixa fechar o diálogo enquanto as ordens estão sendo geradas', async () => {
    mockedApi.createInspection.mockReturnValue(new Promise(() => undefined))
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 1 ordem' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar e gerar 1 ordem' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled())
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('marca o cabeçalho como parcial quando só algumas UCs livres estão selecionadas', async () => {
    renderPage()

    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))

    expect(screen.getByRole('checkbox', { name: 'Selecionar as UCs livres da página' })).toHaveAttribute('aria-checked', 'mixed')
  })

  it('filtra por motivo, município e classe, sem filtro de score mínimo', async () => {
    renderPage()
    await rowOf('UC100002')

    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'queda_subita' } })
    fireEvent.change(await screen.findByLabelText('Município'), { target: { value: 'Recife' } })
    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: 'Comercial' } })

    await waitFor(() => expect(mockedApi.listSuspiciousUnits).toHaveBeenLastCalledWith(
      { motivo: 'queda_subita', municipio: 'Recife', classe: 'Comercial' },
      expect.anything()
    ))
    expect(screen.queryByLabelText('Score mínimo')).not.toBeInTheDocument()
  })

  it('volta para a primeira página ao mudar os filtros', async () => {
    const manyUnits = Array.from({ length: 30 }, (_, index) => buildUnit(`UC2${String(index).padStart(5, '0')}`, 80))
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue(manyUnits))
    renderPage()
    await rowOf('UC200000')
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'queda_subita' } })

    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('mostra a fila inteira de novo ao voltar para "Todos os motivos"', async () => {
    mockedApi.listSuspiciousUnits.mockImplementation(async (filters) =>
      filters.motivo ? buildQueue([UNITS[1]]) : buildQueue(UNITS)
    )
    renderPage()
    await rowOf('UC100003')

    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'queda_subita' } })
    await waitFor(() => expect(screen.queryByRole('row', { name: /UC100003/ })).not.toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: '' } })

    expect(await rowOf('UC100003')).toBeInTheDocument()
  })

  it('cancela a geração sem criar ordens e mantém a seleção', async () => {
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 1 ordem' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockedApi.createInspection).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Gerar 1 ordem' })).toBeEnabled()
  })

  it('fecha o diálogo e limpa a seleção quando todas as ordens são geradas', async () => {
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 1 ordem' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar e gerar 1 ordem' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('button', { name: /^Gerar 0 ordens/ })).toBeDisabled()
  })

  it('mostra o resumo da seleção dentro do diálogo de confirmação', async () => {
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    fireEvent.click(within(await rowOf('UC100003')).getByRole('checkbox'))

    fireEvent.click(await screen.findByRole('button', { name: 'Gerar 2 ordens' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('2.000 kWh/mês')).toBeInTheDocument()
    expect(within(dialog).getByText('1.254 kWh/mês')).toBeInTheDocument()
    expect(within(dialog).getByText('60 de 200')).toBeInTheDocument()
  })

  it('mantém a seleção ao trocar de aba e voltar', async () => {
    renderPage()
    fireEvent.click(within(await rowOf('UC100002')).getByRole('checkbox'))
    await screen.findByRole('button', { name: 'Gerar 1 ordem' })

    fireEvent.click(screen.getByRole('tab', { name: /Ordens de inspeção/ }))
    await screen.findByRole('region', { name: 'Ordens de inspeção' })
    fireEvent.click(screen.getByRole('tab', { name: /Fila priorizada/ }))

    expect(await screen.findByRole('button', { name: 'Gerar 1 ordem' })).toBeEnabled()
    expect(within(await rowOf('UC100002')).getByRole('checkbox')).toBeChecked()
  })

  it('avisa que usa a taxa geral quando o histórico de campo não está disponível', async () => {
    mockedApi.getQueueSummary.mockResolvedValue({
      ...baseSummary,
      taxa_acerto: { inspecoes_total: null, irregularidades_confirmadas: null, taxa: 0.627, periodo_inicio: null, periodo_fim: null }
    })
    renderPage()

    expect(await screen.findByText(/Histórico de campo indisponível/)).toBeInTheDocument()
  })

  it('avisa quando o resumo não carrega, sem esconder a fila', async () => {
    mockedApi.getQueueSummary.mockRejectedValue(new Error('falha'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo')
    expect(await rowOf('UC100002')).toBeInTheDocument()
  })

  it('habilita a exportação só quando há ordens programadas', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar fila \(CSV\)/ })).toBeEnabled())
  })

  it('desliga a exportação quando não há ordem gerada nem em campo', async () => {
    mockedApi.getQueueSummary.mockResolvedValue({ ...baseSummary, capacidade_programada: 0 })
    renderPage()
    await rowOf('UC100002')

    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar fila \(CSV\)/ })).toBeDisabled())
  })

  it('mostra o aviso de histórico de campo sem esconder a fila', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue(UNITS, [
      { codigo: 'historico_campo_nao_aplicado', mensagem: 'Histórico de inspeções não aplicado.' }
    ]))
    renderPage()

    expect(await screen.findByRole('status')).toHaveTextContent('Histórico de inspeções não aplicado.')
    expect(await rowOf('UC100002')).toBeInTheDocument()
  })

  it('explica quando a fila está vazia', async () => {
    mockedApi.listSuspiciousUnits.mockResolvedValue(buildQueue([], [], 0))
    renderPage()

    expect(await screen.findByText('Nenhuma UC suspeita na fila')).toBeInTheDocument()
  })

  it('explica a falha ao carregar a fila', async () => {
    mockedApi.listSuspiciousUnits.mockRejectedValue(new Error('falha'))
    renderPage()

    expect(await screen.findByText('Não foi possível carregar a fila')).toBeInTheDocument()
  })
})
