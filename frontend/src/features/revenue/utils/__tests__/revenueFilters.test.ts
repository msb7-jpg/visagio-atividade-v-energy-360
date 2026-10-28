import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BREAKDOWN_CONTROLS,
  DEFAULT_REVENUE_QUERY,
  HISTORY_MONTHS,
  toApiParams,
  toBreakdownParams,
  toHistoryParams,
  validateRevenueQuery
} from '@/features/revenue/utils/revenueFilters'

describe('toApiParams', () => {
  it('envia as quatro competências no formato da API', () => {
    expect(toApiParams(DEFAULT_REVENUE_QUERY)).toEqual({
      base_inicio: '2022-07',
      base_fim: '2023-06',
      atual_inicio: '2025-07',
      atual_fim: '2026-06'
    })
  })

  it('inclui só os filtros preenchidos', () => {
    const query = { ...DEFAULT_REVENUE_QUERY, filters: { municipio: 'RECIFE', bairro: '  ', classe_consumo: '' } }

    const params = toApiParams(query)

    expect(params.municipio).toBe('RECIFE')
    expect(params).not.toHaveProperty('bairro')
    expect(params).not.toHaveProperty('classe_consumo')
  })
})

describe('toBreakdownParams', () => {
  it('junta janelas, filtros e controles do ranking', () => {
    const query = { ...DEFAULT_REVENUE_QUERY, filters: { municipio: 'RECIFE' } }

    expect(toBreakdownParams(query, DEFAULT_BREAKDOWN_CONTROLS)).toMatchObject({
      base_inicio: '2022-07',
      municipio: 'RECIFE',
      nivel: 'bairro',
      ordenar_por: 'efeito_volume_rs',
      ordem: 'asc',
      page: 1,
      page_size: 10
    })
  })
})

describe('toHistoryParams', () => {
  it('pede 24 meses até o fim da janela atual para o bairro escolhido', () => {
    const params = toHistoryParams(DEFAULT_REVENUE_QUERY, { municipio: 'RECIFE', bairro: 'BOA VIAGEM' })

    expect(params).toEqual({
      municipio: 'RECIFE',
      bairro: 'BOA VIAGEM',
      competencia_fim: '2026-06',
      meses: HISTORY_MONTHS
    })
  })

  it('repassa só a classe de consumo entre os filtros', () => {
    const query = { ...DEFAULT_REVENUE_QUERY, filters: { municipio: 'OLINDA', classe_consumo: 'B1' } }

    const params = toHistoryParams(query, { municipio: 'RECIFE', bairro: 'BOA VIAGEM' })

    expect(params.classe_consumo).toBe('B1')
    expect(params.municipio).toBe('RECIFE')
  })
})

describe('validateRevenueQuery', () => {
  it('aceita as janelas padrão', () => {
    expect(validateRevenueQuery(DEFAULT_REVENUE_QUERY)).toBeNull()
  })

  it('recusa janela com início depois do fim', () => {
    const query = { ...DEFAULT_REVENUE_QUERY, base: { inicio: '2023-06', fim: '2022-07' } }

    expect(validateRevenueQuery(query)).toContain('mês inicial')
  })

  it('recusa janelas sobrepostas ou na ordem errada', () => {
    const query = { ...DEFAULT_REVENUE_QUERY, base: { inicio: '2022-07', fim: '2025-07' } }

    expect(validateRevenueQuery(query)).toContain('terminar antes')
  })
})
