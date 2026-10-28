import { beforeEach, describe, expect, it, vi } from 'vitest'
import { revenueApi } from '@/features/revenue/api/revenueApi'
import { breakdownRow, pageOf } from '@/features/revenue/__tests__/revenueFixtures'
import { fetchAllBreakdownRows, revenueOptionsQueryOptions } from '@/features/revenue/queries/revenueQueries'
import type { BreakdownControls, BreakdownRow } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_BREAKDOWN_CONTROLS, DEFAULT_REVENUE_QUERY } from '@/features/revenue/utils/revenueFilters'
import { distinctValues } from '@/features/revenue/utils/revenueOptions'

vi.mock('@/features/revenue/api/revenueApi', () => ({
  revenueApi: { getBreakdown: vi.fn() }
}))

const mockedGetBreakdown = vi.mocked(revenueApi.getBreakdown)
const PAGE_SIZE = 100

// Recife tem 106 bairros no banco real: a lista dos filtros precisa das duas páginas do ranking.
const neighborhoods: BreakdownRow[] = Array.from({ length: 106 }, (_, position) =>
  breakdownRow({ bairro: `BAIRRO ${String(position + 1).padStart(3, '0')}` })
)

describe('opções dos filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetBreakdown.mockImplementation(async (_query, controls: BreakdownControls) => {
      const start = (controls.page - 1) * PAGE_SIZE
      return pageOf(neighborhoods.slice(start, start + PAGE_SIZE), {
        page: controls.page,
        page_size: PAGE_SIZE,
        total: neighborhoods.length,
        total_pages: 2
      })
    })
  })

  it('lê todas as páginas para o seletor não perder bairros', async () => {
    const controls: BreakdownControls = { ...DEFAULT_BREAKDOWN_CONTROLS, page_size: PAGE_SIZE }

    const page = await fetchAllBreakdownRows(DEFAULT_REVENUE_QUERY, controls)

    expect(mockedGetBreakdown).toHaveBeenCalledTimes(2)
    expect(mockedGetBreakdown.mock.calls.map(([, pageControls]) => pageControls.page)).toEqual([1, 2])
    expect(distinctValues(page, 'bairro')).toHaveLength(106)
    expect(distinctValues(page, 'bairro').at(-1)).toBe('BAIRRO 106')
  })

  it('faz uma única chamada quando o nível cabe numa página', async () => {
    mockedGetBreakdown.mockResolvedValue(pageOf(neighborhoods.slice(0, 3)))

    const page = await fetchAllBreakdownRows(DEFAULT_REVENUE_QUERY, DEFAULT_BREAKDOWN_CONTROLS)

    expect(mockedGetBreakdown).toHaveBeenCalledTimes(1)
    expect(page.items).toHaveLength(3)
  })

  it('guarda a lista dos filtros numa chave própria, separada do ranking', () => {
    const options = revenueOptionsQueryOptions(DEFAULT_REVENUE_QUERY, 'bairro', true, { municipio: 'RECIFE' })

    expect(options.queryKey[1]).toBe('options')
  })
})
