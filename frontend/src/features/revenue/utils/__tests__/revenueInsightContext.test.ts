import { describe, expect, it } from 'vitest'
import { decompositionFixture, kpisFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { buildInsightFilters, buildInsightMetrics } from '@/features/revenue/utils/revenueInsightContext'
import type { RevenueQuery } from '@/features/revenue/types/revenueTypes'

const query: RevenueQuery = {
  base: { inicio: '2022-07', fim: '2023-06' },
  atual: { inicio: '2025-07', fim: '2026-06' },
  filters: {}
}

describe('buildInsightFilters', () => {
  it('leva só as duas janelas quando não há recorte', () => {
    expect(buildInsightFilters(query)).toEqual({ base: '2022-07 a 2023-06', atual: '2025-07 a 2026-06' })
  })

  it('acrescenta apenas os recortes preenchidos', () => {
    const filters = buildInsightFilters({ ...query, filters: { municipio: 'RECIFE', classe_consumo: 'COMERCIAL' } })

    expect(filters).toMatchObject({ municipio: 'RECIFE', classe_consumo: 'COMERCIAL' })
    expect(filters).not.toHaveProperty('bairro')
  })
})

describe('buildInsightMetrics', () => {
  it('traz a variação, os quatro efeitos em milhões de R$ e as variações percentuais com uma casa', () => {
    const decomposition = {
      ...decompositionFixture,
      variacao_rs: 12_576_268,
      variacao_pct: 8.004,
      efeito_preco_rs: 22_610_000,
      efeito_volume_rs: -8_040_000,
      efeito_mix_rs: -460_000,
      efeito_cruzado_rs: -1_530_000
    }

    expect(buildInsightMetrics(decomposition, kpisFixture)).toEqual({
      variacao_receita_mi_rs: 12.58,
      efeito_preco_mi_rs: 22.61,
      efeito_volume_mi_rs: -8.04,
      efeito_mix_mi_rs: -0.46,
      efeito_cruzado_mi_rs: -1.53,
      variacao_receita_pct: 8,
      variacao_volume_pct: -5.8,
      variacao_tarifa_media_pct: 2
    })
  })

  it('não devolve -0 quando um efeito é minúsculo', () => {
    const metrics = buildInsightMetrics({ ...decompositionFixture, efeito_mix_rs: -420.3 }, kpisFixture)

    expect(Object.is(metrics.efeito_mix_mi_rs, 0)).toBe(true)
  })

  it('omite a variação percentual quando não há base comparável', () => {
    const metrics = buildInsightMetrics(decompositionFixture, {
      ...kpisFixture,
      volume_kwh: { base: 0, atual: 10, variacao_pct: null }
    })

    expect(metrics).not.toHaveProperty('variacao_volume_pct')
    expect(metrics).toHaveProperty('variacao_tarifa_media_pct', 2)
  })
})
