import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { lossApi } from '@/features/loss_management/api/lossApi'
import type { QueueFilterOptions, QueueSummary } from '@/features/loss_management/types/lossTypes'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() }
}))

const mockedGet = vi.mocked(apiClient.get)

const summary: QueueSummary = {
  capacidade_total: 200,
  capacidade_programada: 58,
  selecionadas: 3,
  kwh_mes_selecionadas: 7228,
  valor_ano_selecionadas_rs: 61939.6,
  tarifa_rs_kwh: 0.7876,
  tarifa_periodo_inicio: '2025-07',
  tarifa_periodo_fim: '2026-06',
  retorno_esperado_kwh_mes: 4532,
  retorno_esperado_valor_ano_rs: 0,
  taxa_acerto: {
    inspecoes_total: 1389,
    irregularidades_confirmadas: 871,
    taxa: 0.627,
    periodo_inicio: '2025-08',
    periodo_fim: '2025-12'
  }
}

describe('lossApi.getQueueSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envia cada UC selecionada como parâmetro ucs repetido, sem colchetes', async () => {
    mockedGet.mockResolvedValue({ data: summary })

    await lossApi.getQueueSummary(['UC1', 'UC2'])

    const [url, config] = mockedGet.mock.calls[0]
    expect(url).toBe('/losses/queue-summary')
    const requestUri = axios.getUri({ url, params: config?.params, paramsSerializer: config?.paramsSerializer })
    expect(requestUri).toBe('/losses/queue-summary?ucs=UC1&ucs=UC2')
  })

  it('devolve o resumo e repassa o signal de cancelamento', async () => {
    mockedGet.mockResolvedValue({ data: summary })
    const abortController = new AbortController()

    const result = await lossApi.getQueueSummary([], abortController.signal)

    expect(result).toEqual(summary)
    expect(mockedGet.mock.calls[0][1]?.signal).toBe(abortController.signal)
  })
})

describe('lossApi.getQueueFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devolve as opções de município e classe', async () => {
    const options: QueueFilterOptions = { municipios: ['Olinda', 'Recife'], classes: ['Comercial', 'Residencial'] }
    mockedGet.mockResolvedValue({ data: options })

    await expect(lossApi.getQueueFilters()).resolves.toEqual(options)
    expect(mockedGet.mock.calls[0][0]).toBe('/losses/queue-filters')
  })
})
