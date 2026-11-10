import { describe, expect, it } from 'vitest'
import type { BreakdownRow } from '@/features/revenue/types/revenueTypes'
import { nextAreaSort, searchAndSort, toAreaRevenue } from '@/features/revenue/utils/areaRevenue'

const row = (overrides: Partial<BreakdownRow>): BreakdownRow => ({
  municipio: 'RECIFE',
  bairro: 'BOA VIAGEM',
  classe_consumo: null,
  volume_base_kwh: 1000,
  volume_atual_kwh: 800,
  variacao_volume_pct: -20,
  receita_base_rs: 700,
  receita_atual_rs: 800,
  variacao_rs: 100,
  efeito_preco_rs: 0,
  efeito_volume_rs: 0,
  efeito_cruzado_rs: 0,
  ...overrides
})

describe('toAreaRevenue', () => {
  it('calcula a tarifa média como receita sobre volume e a variação contra a base', () => {
    const area = toAreaRevenue(row({}))

    expect(area.name).toBe('Boa Viagem')
    expect(area.place).toBe('Recife')
    expect(area.neighborhood).toEqual({ municipio: 'RECIFE', bairro: 'BOA VIAGEM' })
    expect(area.tariff).toBeCloseTo(1)
    expect(area.tariffPct).toBeCloseTo(42.857, 2)
    expect(area.revenuePct).toBeCloseTo(14.286, 2)
  })

  it('deixa a tarifa vazia sem volume e trata o município como área sem histórico', () => {
    const area = toAreaRevenue(row({ bairro: null, volume_atual_kwh: 0 }))

    expect(area.name).toBe('Recife')
    expect(area.place).toBeNull()
    expect(area.neighborhood).toBeNull()
    expect(area.tariff).toBeNull()
  })
})

describe('searchAndSort', () => {
  const areas = [
    toAreaRevenue(row({ bairro: 'PINA', receita_atual_rs: 300 })),
    toAreaRevenue(row({ bairro: 'GRACAS', receita_atual_rs: 900 })),
    toAreaRevenue(row({ bairro: 'BOA VIAGEM', receita_atual_rs: 500, volume_atual_kwh: 0 }))
  ]

  it('ordena da maior para a menor receita e, invertendo, da menor para a maior', () => {
    expect(searchAndSort(areas, '', { field: 'revenue', direction: 'desc' }).map((area) => area.name)).toEqual(['Gracas', 'Boa Viagem', 'Pina'])
    expect(searchAndSort(areas, '', { field: 'revenue', direction: 'asc' }).map((area) => area.name)).toEqual(['Pina', 'Boa Viagem', 'Gracas'])
  })

  it('começa uma coluna nova do maior para o menor e inverte ao clicar de novo', () => {
    const byRevenue = { field: 'revenue', direction: 'desc' } as const
    expect(nextAreaSort(byRevenue, 'tariff')).toEqual({ field: 'tariff', direction: 'desc' })
    expect(nextAreaSort(byRevenue, 'revenue')).toEqual({ field: 'revenue', direction: 'asc' })
    expect(nextAreaSort({ field: 'revenue', direction: 'asc' }, 'revenue')).toEqual({ field: 'revenue', direction: 'desc' })
  })

  it('busca sem diferenciar acento e maiúsculas, também pelo município', () => {
    expect(searchAndSort(areas, 'graças').map((area) => area.name)).toEqual(['Gracas'])
    expect(searchAndSort(areas, 'recife')).toHaveLength(3)
  })

  it('manda as áreas sem tarifa para o fim nas duas direções', () => {
    expect(searchAndSort(areas, '', { field: 'tariff', direction: 'desc' }).at(-1)?.name).toBe('Boa Viagem')
    expect(searchAndSort(areas, '', { field: 'tariff', direction: 'asc' }).at(-1)?.name).toBe('Boa Viagem')
  })
})
