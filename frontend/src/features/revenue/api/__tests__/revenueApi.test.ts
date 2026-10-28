import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { revenueApi } from '@/features/revenue/api/revenueApi'
import {
  decompositionFixture,
  historyFixture,
  kpisFixture,
  neighborhoodsFixture
} from '@/features/revenue/__tests__/revenueFixtures'
import { DEFAULT_BREAKDOWN_CONTROLS, DEFAULT_REVENUE_QUERY } from '@/features/revenue/utils/revenueFilters'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() }
}))

const mockedGet = vi.mocked(apiClient.get)
const windows = {
  base_inicio: '2022-07',
  base_fim: '2023-06',
  atual_inicio: '2025-07',
  atual_fim: '2026-06'
}

describe('revenueApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getKpis consulta /revenue/kpis com as janelas e devolve o corpo', async () => {
    mockedGet.mockResolvedValue({ data: kpisFixture })
    const controller = new AbortController()

    const result = await revenueApi.getKpis(DEFAULT_REVENUE_QUERY, controller.signal)

    expect(result).toBe(kpisFixture)
    expect(mockedGet).toHaveBeenCalledWith('/revenue/kpis', { params: windows, signal: controller.signal })
  })

  it('getDecomposition consulta /revenue/decomposition', async () => {
    mockedGet.mockResolvedValue({ data: decompositionFixture })

    const result = await revenueApi.getDecomposition(DEFAULT_REVENUE_QUERY)

    expect(result).toBe(decompositionFixture)
    expect(mockedGet).toHaveBeenCalledWith('/revenue/decomposition', { params: windows, signal: undefined })
  })

  it('getBreakdown envia nível, ordenação e página junto das janelas', async () => {
    mockedGet.mockResolvedValue({ data: neighborhoodsFixture })

    const result = await revenueApi.getBreakdown(DEFAULT_REVENUE_QUERY, DEFAULT_BREAKDOWN_CONTROLS)

    expect(result).toBe(neighborhoodsFixture)
    expect(mockedGet).toHaveBeenCalledWith('/revenue/breakdown', {
      params: { ...windows, ...DEFAULT_BREAKDOWN_CONTROLS },
      signal: undefined
    })
  })

  it('getHistory pede os 24 meses do bairro até o fim da janela atual', async () => {
    mockedGet.mockResolvedValue({ data: historyFixture })

    const result = await revenueApi.getHistory(DEFAULT_REVENUE_QUERY, { municipio: 'RECIFE', bairro: 'BOA VIAGEM' })

    expect(result).toBe(historyFixture)
    expect(mockedGet).toHaveBeenCalledWith('/revenue/history', {
      params: { municipio: 'RECIFE', bairro: 'BOA VIAGEM', competencia_fim: '2026-06', meses: 24 },
      signal: undefined
    })
  })
})
