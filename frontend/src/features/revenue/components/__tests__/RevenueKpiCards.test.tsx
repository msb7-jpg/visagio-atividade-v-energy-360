import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RevenueKpiCards } from '@/features/revenue/components/RevenueKpiCards'
import { kpisFixture } from '@/features/revenue/__tests__/revenueFixtures'
import type { RevenueKpis } from '@/features/revenue/types/revenueTypes'

const kpis: RevenueKpis = { ...kpisFixture, ticket_medio_rs: { base: null, atual: null, variacao_pct: null } }

function cardOf(title: string): HTMLElement {
  return screen.getByRole('group', { name: title })
}

describe('RevenueKpiCards', () => {
  it('mostra os quatro indicadores com valor atual e variação', () => {
    render(<RevenueKpiCards kpis={kpis} />)

    expect(within(cardOf('Faturamento')).getByText('-4,0%')).toBeInTheDocument()
    expect(within(cardOf('Volume faturado')).getByText(/100,6/)).toBeInTheDocument()
    expect(within(cardOf('Tarifa média')).getByText('+2,0%')).toBeInTheDocument()
    expect(screen.getByText('Ticket médio por UC')).toBeInTheDocument()
  })

  it('descreve a variação em texto para leitores de tela, sem depender da cor', () => {
    render(<RevenueKpiCards kpis={kpis} />)

    expect(screen.getAllByLabelText('Variação de -4,0% em relação à janela base').length).toBeGreaterThan(0)
  })

  it('mostra a referência da janela base de cada indicador', () => {
    render(<RevenueKpiCards kpis={kpisFixture} />)

    expect(within(cardOf('Volume faturado')).getByText('Base: 106,8 MWh')).toBeInTheDocument()
    expect(within(cardOf('Ticket médio por UC')).getByText(/Base: R\$.1\.084,00/)).toBeInTheDocument()
  })

  it('mostra travessão quando o indicador não tem valor', () => {
    render(<RevenueKpiCards kpis={kpis} />)

    expect(within(cardOf('Ticket médio por UC')).getAllByText('—').length).toBeGreaterThan(0)
  })
})
