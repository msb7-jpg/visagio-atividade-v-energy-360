import { describe, expect, it } from 'vitest'
import {
  lossKeys,
  queueFiltersQueryOptions,
  queueSummaryQueryOptions,
  suspiciousUnitsQueryOptions
} from '@/features/loss_management/queries/lossQueries'

describe('suspiciousUnitsQueryOptions', () => {
  it('omite filtros vazios e score mínimo zero da chave de cache', () => {
    const options = suspiciousUnitsQueryOptions({ municipio: '', bairro: '  ', classe: 'Comercial', score_minimo: 0 })

    expect(options.queryKey).toEqual(lossKeys.suspiciousUnits({ classe: 'Comercial' }))
  })

  it('mantém motivo e score mínimo preenchidos', () => {
    const options = suspiciousUnitsQueryOptions({ motivo: 'queda_subita', score_minimo: 70 })

    expect(options.queryKey).toEqual(lossKeys.suspiciousUnits({ motivo: 'queda_subita', score_minimo: 70 }))
  })
})

describe('queueSummaryQueryOptions', () => {
  it('gera a mesma chave de cache para a mesma seleção em qualquer ordem', () => {
    const firstKey = queueSummaryQueryOptions(['UC2', 'UC1']).queryKey
    const secondKey = queueSummaryQueryOptions(['UC1', 'UC2']).queryKey

    expect(firstKey).toEqual(secondKey)
  })

  it('usa chaves diferentes para seleções diferentes', () => {
    expect(queueSummaryQueryOptions(['UC1']).queryKey).not.toEqual(queueSummaryQueryOptions(['UC1', 'UC2']).queryKey)
  })

  it('fica dentro do domínio de perdas para ser invalidada junto com a fila', () => {
    expect(queueSummaryQueryOptions([]).queryKey.slice(0, 1)).toEqual(lossKeys.all)
    expect(queueFiltersQueryOptions().queryKey.slice(0, 1)).toEqual(lossKeys.all)
  })
})
