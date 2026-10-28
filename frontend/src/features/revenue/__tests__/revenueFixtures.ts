import type {
  BreakdownPage,
  BreakdownRow,
  NeighborhoodHistory,
  PriceVolumeDecomposition,
  RevenueKpis
} from '@/features/revenue/types/revenueTypes'

export const kpisFixture: RevenueKpis = {
  faturamento_rs: { base: 65040, atual: 62452.8, variacao_pct: -4 },
  volume_kwh: { base: 106800, atual: 100560, variacao_pct: -5.8 },
  tarifa_media_rs_kwh: { base: 0.609, atual: 0.6211, variacao_pct: 2 },
  ticket_medio_rs: { base: 1084, atual: 1040.88, variacao_pct: -4 },
  ucs_ativas: { base: 5, atual: 5, variacao_pct: 0 }
}

// Preço + volume + mix + cruzado = -2.587,20 = atual - base.
export const decompositionFixture: PriceVolumeDecomposition = {
  receita_base_rs: 65040,
  receita_atual_rs: 62452.8,
  variacao_rs: -2587.2,
  variacao_pct: -4,
  volume_base_kwh: 106800,
  volume_atual_kwh: 100560,
  efeito_preco_rs: 1250.4,
  efeito_volume_rs: -3500.1,
  efeito_mix_rs: -420.3,
  efeito_cruzado_rs: 82.8
}

/**
 *
 */
export function breakdownRow(overrides: Partial<BreakdownRow>): BreakdownRow {
  return {
    municipio: 'RECIFE',
    bairro: 'BOA VIAGEM',
    classe_consumo: null,
    volume_base_kwh: 30000,
    volume_atual_kwh: 24000,
    variacao_volume_pct: -20,
    receita_base_rs: 18000,
    receita_atual_rs: 14900,
    variacao_rs: -3100,
    efeito_preco_rs: 200,
    efeito_volume_rs: -3300,
    efeito_cruzado_rs: 0,
    ...overrides
  }
}

/**
 *
 */
export function pageOf(items: BreakdownRow[], overrides: Partial<BreakdownPage> = {}): BreakdownPage {
  return { items, total: items.length, page: 1, page_size: 10, total_pages: 1, ...overrides }
}

export const neighborhoodsFixture = pageOf([
  breakdownRow({}),
  breakdownRow({ bairro: 'CASA AMARELA', efeito_volume_rs: -900, variacao_rs: -800, receita_atual_rs: 9000 })
])

export const municipalitiesFixture = pageOf([
  breakdownRow({ bairro: null }),
  breakdownRow({ municipio: 'OLINDA', bairro: null })
])

export const classesFixture = pageOf([
  breakdownRow({ municipio: null, bairro: null, classe_consumo: 'B1' }),
  breakdownRow({ municipio: null, bairro: null, classe_consumo: 'B3' })
])

export const historyFixture: NeighborhoodHistory = {
  municipio: 'RECIFE',
  bairro: 'BOA VIAGEM',
  classe_consumo: null,
  pontos: [
    { competencia: '2026-04', volume_kwh: 2000, receita_rs: 1200, tarifa_media_rs_kwh: 0.6 },
    { competencia: '2026-05', volume_kwh: 0, receita_rs: 0, tarifa_media_rs_kwh: null },
    { competencia: '2026-06', volume_kwh: 2500, receita_rs: 1550, tarifa_media_rs_kwh: 0.62 }
  ]
}
