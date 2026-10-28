import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRevenueRankingControls } from '@/features/revenue/hooks/useRevenueRankingControls'

describe('useRevenueRankingControls', () => {
  it('começa em bairros, maior perda por volume primeiro, página 1', () => {
    const { result } = renderHook(() => useRevenueRankingControls())

    expect(result.current.controls).toMatchObject({ nivel: 'bairro', ordenar_por: 'efeito_volume_rs', ordem: 'asc', page: 1 })
  })

  it('inverte o sentido ao clicar de novo na mesma coluna', () => {
    const { result } = renderHook(() => useRevenueRankingControls())

    act(() => result.current.toggleSort('efeito_volume_rs'))

    expect(result.current.controls.ordem).toBe('desc')
  })

  it('começa por maior perda em colunas de efeito e por maior valor na receita atual', () => {
    const { result } = renderHook(() => useRevenueRankingControls())

    act(() => result.current.toggleSort('efeito_preco_rs'))
    expect(result.current.controls).toMatchObject({ ordenar_por: 'efeito_preco_rs', ordem: 'asc' })

    act(() => result.current.toggleSort('receita_atual_rs'))
    expect(result.current.controls).toMatchObject({ ordenar_por: 'receita_atual_rs', ordem: 'desc' })
  })

  it('volta para a página 1 ao trocar nível ou ordenação', () => {
    const { result } = renderHook(() => useRevenueRankingControls())

    act(() => result.current.changePage(3))
    act(() => result.current.changeLevel('municipio'))
    expect(result.current.controls).toMatchObject({ nivel: 'municipio', page: 1 })

    act(() => result.current.changePage(2))
    act(() => result.current.toggleSort('variacao_rs'))
    expect(result.current.controls.page).toBe(1)
  })

  it('abre e fecha o bairro selecionado', () => {
    const { result } = renderHook(() => useRevenueRankingControls())

    act(() => result.current.openNeighborhood({ municipio: 'RECIFE', bairro: 'BOA VIAGEM' }))
    expect(result.current.selected).toEqual({ municipio: 'RECIFE', bairro: 'BOA VIAGEM' })

    act(() => result.current.closeNeighborhood())
    expect(result.current.selected).toBeNull()
  })
})
