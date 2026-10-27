import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { customer360Api } from '@/features/customer360/api/customer360Api'
import { Customer360Page } from '@/features/customer360/components/Customer360Page'
import type {
  CustomerEventTimeline,
  CustomerHistory,
  CustomerSummary,
  HighBillDiagnosis,
  Invoice
} from '@/features/customer360/types/customer360Types'

vi.mock('@/features/customer360/api/customer360Api', () => ({
  customer360Api: {
    search: vi.fn(),
    getSummary: vi.fn(),
    getHistory: vi.fn(),
    getEvents: vi.fn()
  }
}))

const mockedApi = vi.mocked(customer360Api)

const summary: CustomerSummary = {
  id_uc: 'UC100004',
  nome_titular: null,
  codigo_cliente: 'CLI100004',
  classe_consumo: 'Residencial',
  subgrupo_tarifario: 'B1',
  municipio: 'Recife',
  bairro: 'Arruda',
  alimentador: 'ALM-REC-004',
  subestacao: null,
  numero_medidor_ativo: 'MD500004',
  possui_gd: false,
  potencia_gd_kw: 0,
  data_conexao_gd: null
}

const stableWithFlagChange: HighBillDiagnosis = {
  competencia_referencia: '2026-06',
  competencia_comparada: '2025-06',
  consumo_kwh: 200,
  consumo_kwh_ano_anterior: 200,
  variacao_consumo_pct: 0,
  tendencia_consumo: 'ESTAVEL',
  bandeira_atual: 'VERMELHA_P2',
  bandeira_ano_anterior: 'VERDE',
  bandeira_mudou: true,
  dias_faturamento: 30,
  dias_faturamento_ano_anterior: 30,
  media_diaria_kwh: 6.67,
  media_diaria_kwh_ano_anterior: 6.67,
  variacao_media_diaria_pct: 0,
  tendencia_media_diaria: 'ESTAVEL',
  tarifa_rs_kwh: 0.97,
  tarifa_rs_kwh_ano_anterior: 0.8,
  variacao_tarifa_pct: 21.3,
  leitura_estimada: false
}

function buildInvoice(competencia: string, status: string, valor: number): Invoice {
  return {
    id_fatura: `FT-${competencia}`,
    competencia,
    data_vencimento: `${competencia}-20`,
    data_pagamento: status === 'PAGA' ? `${competencia}-18` : null,
    valor_total_rs: valor,
    consumo_faturado_kwh: 200,
    bandeira_tarifaria: 'VERDE',
    tarifa_aplicada_rs_kwh: 0.88,
    status_pagamento: status
  }
}

const openInvoices = [buildInvoice('2026-06', 'ABERTA', 194), buildInvoice('2026-05', 'VENCIDA', 186)]

function buildHistory(diagnosis: HighBillDiagnosis): CustomerHistory {
  return {
    id_uc: 'UC100004',
    competencia_referencia: '2026-06',
    meses: [{
      competencia: '2026-06',
      competencia_ano_anterior: '2025-06',
      consumo_kwh: diagnosis.consumo_kwh,
      consumo_kwh_ano_anterior: diagnosis.consumo_kwh_ano_anterior,
      variacao_consumo_pct: diagnosis.variacao_consumo_pct,
      valor_total_rs: 194,
      valor_total_rs_ano_anterior: 160,
      variacao_valor_pct: 21.3,
      bandeira_tarifaria: 'VERMELHA_P2',
      dias_faturamento: diagnosis.dias_faturamento,
      dias_faturamento_ano_anterior: diagnosis.dias_faturamento_ano_anterior,
      media_diaria_kwh: diagnosis.media_diaria_kwh,
      media_diaria_kwh_ano_anterior: diagnosis.media_diaria_kwh_ano_anterior,
      variacao_media_diaria_pct: diagnosis.variacao_media_diaria_pct,
      tarifa_rs_kwh: diagnosis.tarifa_rs_kwh,
      tarifa_rs_kwh_ano_anterior: diagnosis.tarifa_rs_kwh_ano_anterior,
      variacao_tarifa_pct: diagnosis.variacao_tarifa_pct,
      tipo_leitura: diagnosis.leitura_estimada ? 'ESTIMADA' : 'REAL'
    }],
    resumo_12_meses: {
      meses_comparados: 12,
      consumo_kwh: 2400,
      consumo_kwh_ano_anterior: 2400,
      variacao_consumo_pct: 0,
      valor_total_rs: 2150.5,
      valor_total_rs_ano_anterior: 1920,
      variacao_valor_pct: 12
    },
    diagnostico: diagnosis,
    faturas: [...openInvoices, buildInvoice('2026-04', 'PAGA', 176)],
    faturas_em_aberto: openInvoices,
    valor_em_aberto_rs: 380,
    pontualidade: { faturas_avaliadas: 11, pagas_em_dia: 8, pagas_com_atraso: 2, atraso_medio_dias: 6, vencidas_em_aberto: 1 }
  }
}

const events: CustomerEventTimeline = {
  id_uc: 'UC100004',
  alimentador: 'ALM-REC-004',
  qualidade_alimentador: [
    { competencia: '2026-06', dec_apurado_horas: 0, fec_apurado_vezes: 0, dec_limite_aneel: 2.5, fec_limite_aneel: 2, violou_meta: false },
    { competencia: '2026-05', dec_apurado_horas: 4.2, fec_apurado_vezes: 3, dec_limite_aneel: 2.5, fec_limite_aneel: 2, violou_meta: true }
  ],
  interrupcoes_uc: [
    {
      id_ocorrencia: 'OC2',
      competencia: '2026-03',
      inicio_interrupcao: '2026-03-02 07:05:00',
      fim_interrupcao: '2026-03-02 11:17:00',
      duracao_horas: 4.2,
      tipo_ocorrencia: 'FIO PARTIDO',
      causa: 'VEGETACAO'
    },
    {
      id_ocorrencia: 'OC1',
      competencia: '2025-07',
      inicio_interrupcao: '2025-07-14 18:20:00',
      fim_interrupcao: '2025-07-14 20:50:00',
      duracao_horas: 2.5,
      tipo_ocorrencia: 'FALTA DE ENERGIA',
      causa: 'CLIMATICA'
    }
  ],
  inspecoes: [
    {
      id_inspecao: 'INS2',
      data_inspecao: '2025-11-04',
      id_inspetor: 'INSP-02',
      irregularidade_constatada: true,
      tipo_irregularidade: 'BY-PASS',
      kwh_recuperado: 1250.5
    },
    {
      id_inspecao: 'INS1',
      data_inspecao: '2025-08-12',
      id_inspetor: 'INSP-07',
      irregularidade_constatada: false,
      tipo_irregularidade: null,
      kwh_recuperado: 0
    }
  ],
  chamados: [{
    id_atendimento: 'AT1',
    numero_protocolo: 'PRT-2026-0003',
    motivo_chamado: 'FATURA',
    data_abertura: '2026-06-25 09:15:00',
    status_chamado: 'ABERTO',
    nota_csat: 4.5
  }]
}

function notFoundError(): AxiosError {
  const response = { status: 404, data: { detail: 'não encontrada' } } as AxiosResponse
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, response)
}

function renderPage(initialPath = '/customers') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Customer360Page />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const SEARCH_LABEL = 'Número da UC, do medidor ou nome do titular'

function typeInSearch(typedId: string) {
  fireEvent.change(screen.getByRole('combobox', { name: SEARCH_LABEL }), { target: { value: typedId } })
}

function searchFor(typedId: string) {
  typeInSearch(typedId)
  fireEvent.click(screen.getByRole('button', { name: /Buscar/ }))
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Customer360Page', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    Element.prototype.scrollIntoView = vi.fn()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mockedApi.search.mockResolvedValue([])
    mockedApi.getSummary.mockResolvedValue(summary)
    mockedApi.getHistory.mockResolvedValue(buildHistory(stableWithFlagChange))
    mockedApi.getEvents.mockResolvedValue(events)
  })

  it('orienta o atendente antes da primeira busca e bloqueia busca vazia', () => {
    renderPage()

    expect(screen.getByText('Busque uma unidade consumidora')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buscar/ })).toBeDisabled()
    expect(mockedApi.getSummary).not.toHaveBeenCalled()
  })

  it('normaliza o número digitado e mostra o cadastro da UC', async () => {
    renderPage()
    searchFor('  uc100004 ')

    expect(await screen.findByText('MD500004')).toBeInTheDocument()
    expect(mockedApi.getSummary).toHaveBeenCalledWith('UC100004', expect.anything())
    expect(screen.getByText('Alimentador ALM-REC-004')).toBeInTheDocument()
    expect(screen.getByText('Sem geração própria')).toBeInTheDocument()
  })

  it('explica conta alta com consumo estável pela mudança de bandeira', async () => {
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/O consumo de jun\/2026 ficou estável/)).toBeInTheDocument()
    expect(screen.getByText(/A bandeira tarifária ficou mais cara \(de Verde para Vermelha P2\)/)).toBeInTheDocument()
  })

  it('explica a conta pelo preço do kWh e mostra os totais de 12 meses', async () => {
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/O preço médio do kWh subiu 21,3%/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s0,97\/kWh vs R\$\s0,80\/kWh/)).toBeInTheDocument()
    expect(screen.getByText('Últimos 12 meses · consumo')).toBeInTheDocument()
    expect(screen.getByText('R$ 2.150,50')).toBeInTheDocument()
  })

  it('separa período de faturamento mais longo do consumo real', async () => {
    mockedApi.getHistory.mockResolvedValue(buildHistory({
      ...stableWithFlagChange,
      consumo_kwh: 240,
      variacao_consumo_pct: 20,
      tendencia_consumo: 'SUBIU',
      bandeira_mudou: false,
      dias_faturamento: 36,
      media_diaria_kwh: 6.67,
      variacao_media_diaria_pct: 0,
      variacao_tarifa_pct: null
    }))
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/Este período teve 36 dias de faturamento contra 30; por dia, o consumo ficou estável/)).toBeInTheDocument()
    expect(screen.queryByText(/preço médio do kWh/)).not.toBeInTheDocument()
  })

  it('aponta aumento real de consumo', async () => {
    mockedApi.getHistory.mockResolvedValue(buildHistory({
      ...stableWithFlagChange,
      consumo_kwh: 280,
      variacao_consumo_pct: 40,
      tendencia_consumo: 'SUBIU',
      bandeira_mudou: false
    }))
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/subiu \(\+40%\)/)).toBeInTheDocument()
    expect(screen.queryByText(/A bandeira tarifária/)).not.toBeInTheDocument()
  })

  it('lista faturas com o total em aberto e a situação de cada uma', async () => {
    renderPage()
    searchFor('UC100004')

    fireEvent.click(await screen.findByRole('tab', { name: /Faturas.*2 em aberto/ }))

    expect(await screen.findByText(/2 faturas em aberto, total de R\$\s380,00/)).toBeInTheDocument()
    expect(screen.getByText('Últimas 11 contas: 8 pagas em dia, 2 com atraso (atraso médio de 6 dias) e 1 vencida em aberto.')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Faturas da unidade consumidora' })
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
    expect(within(table).getByText('Aberta')).toBeInTheDocument()
    expect(within(table).getByText('Paga')).toBeInTheDocument()
  })

  it('mostra falta de luz na região e os chamados do cliente', async () => {
    renderPage()
    searchFor('UC100004')

    fireEvent.click(await screen.findByRole('tab', { name: /Interrupções/ }))

    expect(await screen.findByText(/1 mês ficou acima do normal; o pior foi mai\/2026 \(4,2 h\)/)).toBeInTheDocument()
    const outages = screen.getByRole('table', { name: 'Interrupções no alimentador' })
    expect(within(outages).getByText('Acima do normal')).toBeInTheDocument()
    expect(within(outages).getByText('3 vezes')).toBeInTheDocument()
    const tickets = screen.getByRole('list', { name: 'Chamados abertos' })
    expect(within(tickets).getByText('PRT-2026-0003')).toBeInTheDocument()
    expect(within(tickets).getByText('Nota 4.5')).toBeInTheDocument()
  })

  it('lista cada interrupção que atingiu a própria UC', async () => {
    renderPage()
    searchFor('UC100004')

    fireEvent.click(await screen.findByRole('tab', { name: /Interrupções/ }))

    expect(await screen.findByText(/Esta unidade teve 2 interrupções registradas, somando 6,7 h sem energia/)).toBeInTheDocument()
    expect(screen.getByText(/A mais longa começou em 02\/03\/2026 às 07:05 e durou 4,2 h \(vegetação\)/)).toBeInTheDocument()
    const outages = screen.getByRole('table', { name: 'Interrupções na unidade consumidora' })
    expect(within(outages).getByText('14/07/2025 às 18:20')).toBeInTheDocument()
    expect(within(outages).getByText('Fio partido')).toBeInTheDocument()
    expect(within(outages).getByText('Climática')).toBeInTheDocument()
  })

  it('mostra o histórico de inspeções de perdas da UC', async () => {
    renderPage()
    searchFor('UC100004')

    fireEvent.click(await screen.findByRole('tab', { name: /Inspeções/ }))

    expect(await screen.findByText('2 inspeções feitas nesta unidade: irregularidade constatada em 1, com 1.250,5 kWh recuperados.')).toBeInTheDocument()
    const inspections = screen.getByRole('table', { name: 'Inspeções de perdas da unidade consumidora' })
    expect(within(inspections).getByText('Irregular')).toBeInTheDocument()
    expect(within(inspections).getByText('Regular')).toBeInTheDocument()
    expect(within(inspections).getByText('By-pass')).toBeInTheDocument()
  })

  it('avisa quando a leitura do mês foi estimada', async () => {
    mockedApi.getHistory.mockResolvedValue(buildHistory({ ...stableWithFlagChange, leitura_estimada: true }))
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/A leitura de jun\/2026 foi estimada pela média/)).toBeInTheDocument()
  })

  it('resume faturas em aberto, falta de luz e chamados sem trocar de aba', async () => {
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText('R$ 380,00')).toBeInTheDocument()
    expect(screen.getByText('2 faturas em aberto.')).toBeInTheDocument()
    expect(await screen.findByText('Acima do normal no último ano; o mais recente foi mai/2026.')).toBeInTheDocument()
    expect(screen.getByText('Último aberto em 25/06/2026.')).toBeInTheDocument()
  })

  it('lembra o efeito da geração solar no diagnóstico de conta alta', async () => {
    mockedApi.getSummary.mockResolvedValue({ ...summary, possui_gd: true, potencia_gd_kw: 4.5 })
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/a energia gerada é abatida do consumo faturado/)).toBeInTheDocument()
    expect(screen.getByText(/GD Solar \(4,5 kW\)/)).toBeInTheDocument()
  })

  it('explica a queda de consumo pelo painel solar ligado no último ano', async () => {
    mockedApi.getSummary.mockResolvedValue({ ...summary, possui_gd: true, potencia_gd_kw: 4.5, data_conexao_gd: '2025-09-15' })
    renderPage()
    searchFor('UC100004')

    expect(await screen.findByText(/O painel solar foi ligado em set\/2025, depois de jun\/2025/)).toBeInTheDocument()
    expect(screen.getByText(/desde set\/2025/)).toBeInTheDocument()
  })

  it('aceita só os dígitos do número da conta e guarda a UC no endereço da página', async () => {
    renderPage()
    searchFor('100004')

    expect(await screen.findByText('MD500004')).toBeInTheDocument()
    expect(mockedApi.getSummary).toHaveBeenCalledWith('UC100004', expect.anything())
  })

  it('abre direto a UC informada no endereço da página', async () => {
    renderPage('/customers?uc=UC100004')

    expect(await screen.findByText('MD500004')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: SEARCH_LABEL })).toHaveValue('UC100004')
  })

  it('sugere UCs enquanto o atendente digita e abre a escolhida', async () => {
    mockedApi.search.mockResolvedValue([{
      id_uc: 'UC100004',
      nome_titular: null,
      numero_medidor_ativo: 'MD500004',
      bairro: 'Arruda',
      municipio: 'Recife',
      classe_consumo: 'Residencial',
      possui_gd: false
    }])
    renderPage()
    typeInSearch('10000')

    const suggestion = await screen.findByRole('option', { name: /UC100004/ })
    expect(mockedApi.search).toHaveBeenCalledWith('10000', expect.anything())
    fireEvent.click(suggestion)

    expect(await screen.findByText('MD500004')).toBeInTheDocument()
    expect(mockedApi.getSummary).toHaveBeenCalledWith('UC100004', expect.anything())
  })

  it('sugere UCs pelo nome do titular', async () => {
    mockedApi.search.mockResolvedValue([{
      id_uc: 'UC100001',
      nome_titular: 'Maria da Silva',
      numero_medidor_ativo: 'MD500001',
      bairro: 'Arruda',
      municipio: 'Recife',
      classe_consumo: 'Residencial',
      possui_gd: false
    }])
    renderPage()
    typeInSearch('silva')

    expect(await screen.findByRole('option', { name: /UC100001.*Maria da Silva/ })).toBeInTheDocument()
    expect(mockedApi.search).toHaveBeenCalledWith('silva', expect.anything())
  })

  it('lembra as UCs consultadas como atalhos de busca recente', async () => {
    renderPage()
    searchFor('UC100004')
    await screen.findByText('MD500004')

    const recents = await screen.findByRole('navigation', { name: 'Buscas recentes' })
    expect(within(recents).getByText('UC100004')).toBeInTheDocument()
    fireEvent.click(within(recents).getByRole('button', { name: 'Limpar' }))
    expect(screen.queryByRole('navigation', { name: 'Buscas recentes' })).not.toBeInTheDocument()
  })

  it('avisa quando a UC não existe', async () => {
    mockedApi.getSummary.mockRejectedValue(notFoundError())
    renderPage()
    searchFor('UC999999')

    expect(await screen.findByText('Unidade Consumidora não encontrada')).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma unidade com o número UC999999/)).toBeInTheDocument()
  })
})
