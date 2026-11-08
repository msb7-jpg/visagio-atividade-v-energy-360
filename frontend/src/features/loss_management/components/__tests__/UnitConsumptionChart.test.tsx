import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UnitConsumptionChart } from '@/features/loss_management/components/UnitConsumptionChart'
import type { MonthlyConsumption } from '@/features/loss_management/types/unitDetailTypes'

interface LineProbe {
  connectNulls?: boolean
  stroke?: string
}

// O ResponsiveContainer não mede nada no jsdom: troca o Recharts por sondas que expõem o que o gráfico recebe.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ data, children }: { data: MonthlyConsumption[]; children: ReactNode }) => (
    <div data-testid="line-chart" data-points={JSON.stringify(data)}>{children}</div>
  ),
  Line: ({ connectNulls, stroke }: LineProbe) => (
    <i data-testid="line" data-connect-nulls={String(connectNulls)} data-stroke={stroke} />
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => <i data-testid="average-line" />,
  ReferenceArea: ({ x1, x2 }: { x1: string; x2: string }) => <i data-testid="score-area" data-x1={x1} data-x2={x2} />
}))

function buildMonths(values: Array<number | null>): MonthlyConsumption[] {
  return values.map((consumo, position) => ({
    competencia: `2026-${String(position + 1).padStart(2, '0')}`,
    consumo_kwh: consumo
  }))
}

describe('UnitConsumptionChart', () => {
  it('entrega o mês sem leitura como nulo, sem virar zero, e não liga os pontos por cima da lacuna', () => {
    render(<UnitConsumptionChart months={buildMonths([300, null, 280, 0])} />)

    const points = JSON.parse(screen.getByTestId('line-chart').dataset.points ?? '[]') as MonthlyConsumption[]
    expect(points[1].consumo_kwh).toBeNull()
    expect(points[3].consumo_kwh).toBe(0)
    expect(screen.getByTestId('line')).toHaveAttribute('data-connect-nulls', 'false')
  })

  it('usa o token de cor chart-1 na série', () => {
    render(<UnitConsumptionChart months={buildMonths([300, 290])} />)

    expect(screen.getByTestId('line')).toHaveAttribute('data-stroke', 'var(--color-chart-1)')
  })

  it('avisa quando nenhum dos meses tem leitura', () => {
    render(<UnitConsumptionChart months={buildMonths([null, null, null])} />)

    expect(screen.getByText('Sem leituras nos últimos 12 meses.')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('avisa que não há leituras no histórico quando a série é a completa', () => {
    render(<UnitConsumptionChart months={buildMonths([null, null])} fullHistory />)

    expect(screen.getByText('Sem leituras no histórico da UC.')).toBeInTheDocument()
  })

  it('sombreia a janela recente e a base do score com a legenda explicando as faixas', () => {
    render(<UnitConsumptionChart months={buildMonths([1, 2, 3, 4, 5, 6])} />)

    const areas = screen.getAllByTestId('score-area')
    expect(areas.map((area) => [area.dataset.x1, area.dataset.x2])).toEqual([
      ['2026-01', '2026-03'],
      ['2026-04', '2026-06']
    ])
    expect(screen.getByText('Base do score (12 meses)')).toBeInTheDocument()
    expect(screen.getByText('Últimos 3 meses')).toBeInTheDocument()
  })

  it('traça a média da base e a dos 3 últimos meses quando recebe as médias', () => {
    render(<UnitConsumptionChart months={buildMonths([1, 2, 3, 4, 5, 6])} averages={{ baseKwh: 2, recentKwh: 5 }} />)

    expect(screen.getAllByTestId('average-line')).toHaveLength(2)
    expect(screen.getByText('Média da faixa')).toBeInTheDocument()
  })
})
