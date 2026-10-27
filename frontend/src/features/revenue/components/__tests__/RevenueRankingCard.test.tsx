import type { UseQueryResult } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { neighborhoodsFixture, pageOf } from '@/features/revenue/__tests__/revenueFixtures'
import { RevenueRankingCard } from '@/features/revenue/components/RevenueRankingCard'
import type { useRevenueRankingControls } from '@/features/revenue/hooks/useRevenueRankingControls'
import type { BreakdownPage } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_BREAKDOWN_CONTROLS } from '@/features/revenue/utils/revenueFilters'

type Ranking = ReturnType<typeof useRevenueRankingControls>

function makeRanking(overrides: Partial<Ranking> = {}): Ranking {
  return {
    controls: DEFAULT_BREAKDOWN_CONTROLS,
    selected: null,
    changeLevel: vi.fn(),
    toggleSort: vi.fn(),
    changePage: vi.fn(),
    resetPage: vi.fn(),
    openNeighborhood: vi.fn(),
    closeNeighborhood: vi.fn(),
    ...overrides
  }
}

function makeQuery(overrides: Partial<UseQueryResult<BreakdownPage>> = {}): UseQueryResult<BreakdownPage> {
  return {
    data: neighborhoodsFixture,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides
  } as UseQueryResult<BreakdownPage>
}

describe('RevenueRankingCard', () => {
  it('lista os bairros com município, volume e efeitos formatados', () => {
    render(<RevenueRankingCard breakdownQuery={makeQuery()} ranking={makeRanking()} />)

    expect(screen.getByRole('button', { name: 'BOA VIAGEM' })).toBeInTheDocument()
    expect(screen.getAllByText('RECIFE')).toHaveLength(2)
    expect(screen.getByText(/-R\$.3\.300,00/)).toBeInTheDocument()
    expect(screen.getAllByText('24 MWh')).toHaveLength(2)
  })

  it('abre o histórico ao clicar no bairro', () => {
    const ranking = makeRanking()
    render(<RevenueRankingCard breakdownQuery={makeQuery()} ranking={ranking} />)

    fireEvent.click(screen.getByRole('button', { name: 'BOA VIAGEM' }))

    expect(ranking.openNeighborhood).toHaveBeenCalledWith({ municipio: 'RECIFE', bairro: 'BOA VIAGEM' })
  })

  it('ordena ao clicar no cabeçalho e indica a ordenação ativa', () => {
    const ranking = makeRanking()
    render(<RevenueRankingCard breakdownQuery={makeQuery()} ranking={ranking} />)

    fireEvent.click(screen.getByRole('button', { name: /Receita atual/ }))

    expect(ranking.toggleSort).toHaveBeenCalledWith('receita_atual_rs')
    expect(screen.getByRole('columnheader', { name: /Efeito-volume/ })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: /Receita atual/ })).toHaveAttribute('aria-sort', 'none')
  })

  it('troca o nível pelas abas', () => {
    const ranking = makeRanking()
    render(<RevenueRankingCard breakdownQuery={makeQuery()} ranking={ranking} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Municípios' }))

    expect(ranking.changeLevel).toHaveBeenCalledWith('municipio')
  })

  it('pagina com anterior e próxima', () => {
    const ranking = makeRanking()
    const data = pageOf(neighborhoodsFixture.items, { page: 2, total: 22, total_pages: 3 })
    render(<RevenueRankingCard breakdownQuery={makeQuery({ data })} ranking={ranking} />)

    expect(screen.getByText('Página 2 de 3 · 22 linhas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    fireEvent.click(screen.getByRole('button', { name: /Anterior/ }))

    expect(ranking.changePage).toHaveBeenNthCalledWith(1, 3)
    expect(ranking.changePage).toHaveBeenNthCalledWith(2, 1)
  })

  it('bloqueia anterior na primeira página e próxima na última', () => {
    render(<RevenueRankingCard breakdownQuery={makeQuery()} ranking={makeRanking()} />)

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled()
  })

  it('mostra estado vazio quando o recorte não tem linhas', () => {
    render(<RevenueRankingCard breakdownQuery={makeQuery({ data: pageOf([]) })} ranking={makeRanking()} />)

    expect(screen.getByText('Nenhuma linha neste recorte')).toBeInTheDocument()
  })

  it('mostra o erro da consulta', () => {
    render(<RevenueRankingCard breakdownQuery={makeQuery({ data: undefined, isError: true })} ranking={makeRanking()} />)

    expect(screen.getByText('Não foi possível carregar o ranking')).toBeInTheDocument()
  })
})
