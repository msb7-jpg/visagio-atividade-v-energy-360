import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRevenueFilters } from '@/features/revenue/hooks/useRevenueFilters'
import { DEFAULT_REVENUE_QUERY } from '@/features/revenue/utils/revenueFilters'

describe('useRevenueFilters', () => {
  it('limpa o bairro quando o município muda', () => {
    const { result } = renderHook(() => useRevenueFilters())

    act(() => result.current.changeFilter('municipio', 'RECIFE'))
    act(() => result.current.changeFilter('bairro', 'BOA VIAGEM'))
    expect(result.current.query.filters).toEqual({ municipio: 'RECIFE', bairro: 'BOA VIAGEM' })

    act(() => result.current.changeFilter('municipio', 'OLINDA'))

    expect(result.current.query.filters.municipio).toBe('OLINDA')
    expect(result.current.query.filters.bairro).toBeUndefined()
  })

  it('mantém o bairro ao mudar só a classe de consumo', () => {
    const { result } = renderHook(() => useRevenueFilters())

    act(() => result.current.changeFilter('municipio', 'RECIFE'))
    act(() => result.current.changeFilter('bairro', 'BOA VIAGEM'))
    act(() => result.current.changeFilter('classe_consumo', 'B1'))

    expect(result.current.query.filters).toEqual({ municipio: 'RECIFE', bairro: 'BOA VIAGEM', classe_consumo: 'B1' })
  })

  it('restaura o padrão, inclusive o bairro', () => {
    const { result } = renderHook(() => useRevenueFilters())

    act(() => result.current.changeFilter('municipio', 'RECIFE'))
    act(() => result.current.changeFilter('bairro', 'BOA VIAGEM'))
    act(() => result.current.reset())

    expect(result.current.query).toEqual(DEFAULT_REVENUE_QUERY)
  })
})
