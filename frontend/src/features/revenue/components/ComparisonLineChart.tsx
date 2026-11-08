import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartLegendItem, ChartTooltipFrame } from '@/components/ui/chart'
import type { ComparedArea } from '@/features/revenue/hooks/useAreaComparison'
import { formatCompactCurrency, formatCompetencia } from '@/features/revenue/utils/revenueFormatters'
import type { HistoryMetric } from '@/features/revenue/utils/revenueHistoryMetrics'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }
const SERIES = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const

type ChartRow = Record<string, string | number | null>

function toRows(series: ComparedArea[], metric: HistoryMetric): ChartRow[] {
  const rows = new Map<string, ChartRow>()
  series.forEach((area, index) => {
    for (const point of area.points) {
      const row = rows.get(point.competencia) ?? { competencia: point.competencia }
      row[`serie${index}`] = point[metric.key]
      rows.set(point.competencia, row)
    }
  })
  return [...rows.values()].sort((first, second) => String(first.competencia).localeCompare(String(second.competencia)))
}

function ComparisonTooltip({ active, payload, series, metric }: TooltipProps<number, string> & { series: ComparedArea[]; metric: HistoryMetric }) {
  const row = payload?.[0]?.payload as ChartRow | undefined
  if (!active || !row) return null
  return (
    <ChartTooltipFrame title={formatCompetencia(String(row.competencia))}>
      {series.map((area, index) => (
        <span key={area.key}>{area.name}: {metric.format(row[`serie${index}`] as number | null)}</span>
      ))}
    </ChartTooltipFrame>
  )
}

interface ComparisonLineChartProps {
  series: ComparedArea[]
  metric: HistoryMetric
}

/**
 * Uma linha por bairro, todas na mesma escala (eixo comum a partir de zero), para comparar a métrica escolhida mês a mês.
 *
 * @param props - Bairros escolhidos com a série mensal de cada um e a métrica (rótulo e formatação).
 * @returns Legenda por cor e gráfico de linhas com eixo e tooltip na unidade da métrica.
 */
export function ComparisonLineChart({ series, metric }: ComparisonLineChartProps) {
  const axisFormat = metric.key === 'receita_rs' ? formatCompactCurrency : metric.format
  const names = series.map((area) => area.name).join(', ')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        {series.map((area, index) => <ChartLegendItem key={area.key} label={area.name} series={SERIES[index]} />)}
      </div>
      <ChartContainer label={`${metric.seriesLabel} por mês: ${names}`}>
        <LineChart data={toRows(series, metric)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="competencia" tickFormatter={formatCompetencia} tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={24} />
          <YAxis domain={[0, 'auto']} tickFormatter={axisFormat} tickLine={false} axisLine={false} tick={AXIS_TICK} width={72} />
          <Tooltip content={<ComparisonTooltip series={series} metric={metric} />} />
          {series.map((area, index) => (
            <Line key={area.key} dataKey={`serie${index}`} stroke={`var(--color-${SERIES[index]})`} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
