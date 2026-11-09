import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaRevenueTable } from '@/features/revenue/components/AreaRevenueTable'
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

describe('AreaRevenueTable', () => {
  it('mostra os dados de receita, média por mês, variação, volume e tarifa', () => {
    const onSelect = vi.fn()
    render(
      <AreaRevenueTable
        areas={[area]}
        monthsInWindow={12}
        levelLabel="Bairro"
        sortField="revenue"
        selectedKey={null}
        onSort={vi.fn()}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('Boa Viagem')).toBeInTheDocument()
    expect(screen.getByText('Recife')).toBeInTheDocument()
    expect(screen.getByText(/100\s?mil\/mês/)).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /12 meses/i })).not.toBeInTheDocument()
  })

  it('chama onSelect ao clicar na linha do bairro', () => {
    const onSelect = vi.fn()
    render(
      <AreaRevenueTable
        areas={[area]}
        monthsInWindow={12}
        levelLabel="Bairro"
        sortField="revenue"
        selectedKey={area.key}
        onSort={vi.fn()}
        onSelect={onSelect}
      />
    )

    const row = screen.getByText('Boa Viagem').closest('tr')
    expect(row).toHaveAttribute('data-state', 'selected')

    if (row) {
      fireEvent.click(row)
    }
    expect(onSelect).toHaveBeenCalledWith(area.neighborhood)
  })

  it('permite reordenar pelas colunas sortable', () => {
    const onSort = vi.fn()
    render(
      <AreaRevenueTable
        areas={[area]}
        monthsInWindow={12}
        levelLabel="Bairro"
        sortField="revenue"
        selectedKey={null}
        onSort={onSort}
        onSelect={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /tarifa média/i }))
    expect(onSort).toHaveBeenCalledWith('tariff')
  })
})
