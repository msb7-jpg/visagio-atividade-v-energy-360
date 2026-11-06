import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaRevenueTable } from '@/features/revenue/components/AreaRevenueTable'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { toAreaRevenue } from '@/features/revenue/utils/areaRevenue'

const area = toAreaRevenue({
  municipio: 'RECIFE',
  bairro: 'BOA VIAGEM',
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

const points: MonthlyPoint[] = Array.from({ length: 24 }, (_, index) => ({
  competencia: `${2024 + Math.floor((index + 6) / 12)}-${String(((index + 6) % 12) + 1).padStart(2, '0')}`,
  volume_kwh: 100_000,
  receita_rs: 80_000 + index,
  tarifa_media_rs_kwh: 0.8
}))

function renderTable() {
  render(
    <AreaRevenueTable
      areas={[area]}
      histories={new Map([[area.key, points]])}
      monthsInWindow={12}
      levelLabel="Bairro"
      sortField="revenue"
      onSort={vi.fn()}
      onOpen={vi.fn()}
    />
  )
}

describe('AreaRevenueTable', () => {
  it('mostra a receita média por mês e os 12 meses em barras na própria linha', () => {
    renderTable()

    expect(screen.getByText(/100,0\smil\/mês/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Receita mensal: jul\/2025/ })).toBeInTheDocument()
  })

  it('abre receita, volume e tarifa de cada mês sem sair da tabela', () => {
    renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'Mês a mês' }))

    const table = screen.getByRole('table', { name: 'Receita por bairro' })
    expect(within(table).getByText('jun/2026')).toBeInTheDocument()
    expect(within(table).getAllByText('Tarifa média')).toHaveLength(3)
    expect(within(table).queryByText('jun/2025')).not.toBeInTheDocument()
  })
})
