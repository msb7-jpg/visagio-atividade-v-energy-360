import { describe, expect, it } from 'vitest'
import { breakdownRow, municipalitiesFixture, pageOf } from '@/features/revenue/__tests__/revenueFixtures'
import { distinctValues } from '@/features/revenue/utils/revenueOptions'

describe('distinctValues', () => {
  it('devolve os valores únicos em ordem alfabética', () => {
    const page = pageOf([
      breakdownRow({ municipio: 'RECIFE' }),
      breakdownRow({ municipio: 'OLINDA' }),
      breakdownRow({ municipio: 'RECIFE' })
    ])

    expect(distinctValues(page, 'municipio')).toEqual(['OLINDA', 'RECIFE'])
  })

  it('ignora valores vazios', () => {
    expect(distinctValues(municipalitiesFixture, 'classe_consumo')).toEqual([])
  })

  it('devolve lista vazia enquanto a consulta carrega', () => {
    expect(distinctValues(undefined, 'municipio')).toEqual([])
  })
})
