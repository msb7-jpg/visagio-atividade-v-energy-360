import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { historyFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { NeighborhoodHistorySheet } from '@/features/revenue/components/NeighborhoodHistorySheet'

const neighborhood = { municipio: 'RECIFE', bairro: 'BOA VIAGEM' }

function renderSheet(overrides: Partial<Parameters<typeof NeighborhoodHistorySheet>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <NeighborhoodHistorySheet
      neighborhood={neighborhood}
      history={historyFixture}
      isLoading={false}
      isError={false}
      error={null}
      onClose={onClose}
      {...overrides}
    />
  )
  return onClose
}

describe('NeighborhoodHistorySheet', () => {
  it('mostra o bairro, o município e a receita do último mês', () => {
    renderSheet()

    expect(screen.getByText('BOA VIAGEM')).toBeInTheDocument()
    expect(screen.getByText(/RECIFE · últimos 24 meses/)).toBeInTheDocument()
    expect(screen.getAllByText(/1\.550,00/).length).toBeGreaterThan(0)
  })

  it('troca a métrica pelas abas', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('tab', { name: 'Volume' }))

    expect(screen.getAllByText('2,5 MWh').length).toBeGreaterThan(0)
  })

  it('oferece a série em tabela para leitores de tela', () => {
    renderSheet()

    expect(screen.getByRole('table', { name: 'Receita mensal por mês' })).toBeInTheDocument()
  })

  it('fica fechada sem bairro escolhido', () => {
    renderSheet({ neighborhood: null, history: undefined })

    expect(screen.queryByText('Receita')).not.toBeInTheDocument()
  })

  it('mostra erro e estado vazio', () => {
    renderSheet({ history: undefined, isError: true })
    expect(screen.getByText('Não foi possível carregar o histórico')).toBeInTheDocument()
  })

  it('mostra estado vazio quando a série não tem pontos', () => {
    renderSheet({ history: { ...historyFixture, pontos: [] } })

    expect(screen.getByText('Sem histórico para este bairro')).toBeInTheDocument()
  })
})
