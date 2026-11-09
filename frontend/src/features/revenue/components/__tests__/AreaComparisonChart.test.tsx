import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AreaComparisonChart } from '@/features/revenue/components/AreaComparisonChart'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { toAreaRevenue } from '@/features/revenue/utils/areaRevenue'

const NAMES = ['BOA VIAGEM', 'PINA', 'IMBIRIBEIRA', 'AFOGADOS', 'CORDEIRO', 'ILHA DO LEITE']

function buildArea(bairro: string) {
  return toAreaRevenue({
    municipio: 'RECIFE',
    bairro,
    classe_consumo: null,
    volume_base_kwh: 1_000_000,
    volume_atual_kwh: 1_200_000,
    variacao_volume_pct: 20,
    receita_base_rs: 600_000,
    receita_atual_rs: 1_200_000,
    variacao_rs: 600_000,
    efeito_preco_rs: 0,
    efeito_volume_rs: 0,
    efeito_cruzado_rs: 0
  })
}

const areas = NAMES.map(buildArea)
const points: MonthlyPoint[] = Array.from({ length: 12 }, (_, index) => ({
  competencia: `2025-${String(index + 1).padStart(2, '0')}`,
  volume_kwh: 100_000,
  receita_rs: 80_000 + index,
  tarifa_media_rs_kwh: 0.8
}))
const histories = new Map(areas.map((area) => [area.key, points]))

function checkboxOf(name: string) {
  return screen.getByRole('checkbox', { name: new RegExp(name) })
}

describe('AreaComparisonChart', () => {
  it('põe a métrica e a unidade no título e compara os três primeiros bairros', () => {
    render(<AreaComparisonChart areas={areas} histories={histories} />)

    expect(screen.getByRole('heading', { name: 'Receita mensal por bairro · R$ por mês' })).toBeInTheDocument()
    expect(checkboxOf('Boa Viagem')).toBeChecked()
    expect(checkboxOf('Imbiribeira')).toBeChecked()
    expect(checkboxOf('Afogados')).not.toBeChecked()
    expect(screen.getByRole('img', { name: /^Receita mensal por mês: Boa Viagem/ })).toBeInTheDocument()
  })

  it('troca a métrica sem mudar os bairros escolhidos', () => {
    render(<AreaComparisonChart areas={areas} histories={histories} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Tarifa' }))

    expect(screen.getByRole('heading', { name: 'Tarifa média por bairro · R$ por kWh' })).toBeInTheDocument()
    expect(checkboxOf('Pina')).toBeChecked()
  })

  it('limita a comparação a 5 bairros e mantém ao menos 1', () => {
    render(<AreaComparisonChart areas={areas} histories={histories} />)

    fireEvent.click(checkboxOf('Afogados'))
    fireEvent.click(checkboxOf('Cordeiro'))
    expect(checkboxOf('Ilha do Leite')).toBeDisabled()

    fireEvent.click(checkboxOf('Cordeiro'))
    expect(checkboxOf('Ilha do Leite')).toBeEnabled()
    for (const name of ['Afogados', 'Imbiribeira', 'Pina']) fireEvent.click(checkboxOf(name))
    expect(checkboxOf('Boa Viagem')).toBeDisabled()
  })

  it('avisa que o histórico está carregando enquanto não há séries', () => {
    render(<AreaComparisonChart areas={areas} histories={new Map()} />)

    expect(screen.getByText(/Carregando o histórico dos bairros/)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
