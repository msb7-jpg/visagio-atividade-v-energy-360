import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartLegendItem, ChartTooltipFrame } from '@/components/ui/chart'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { FeederHistoryPoint } from '@/features/grid_quality/types/qualityTypes'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }

function HistoryTooltip({ active, payload }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as FeederHistoryPoint | undefined
  if (!active || !point) {
    return null
  }
  return (
    <ChartTooltipFrame title={formatCompetencia(point.competencia)}>
      <span>DEC acumulado no ano: {formatDecimal(point.dec_acumulado_ano_horas)} h (limite {formatDecimal(point.dec_limite_horas)} h)</span>
      <span>FEC acumulado no ano: {formatDecimal(point.fec_acumulado_ano_vezes)} (limite {formatDecimal(point.fec_limite_vezes)})</span>
      <span className="text-muted-foreground">No mês: DEC {formatDecimal(point.dec_apurado_horas)} h, FEC {formatDecimal(point.fec_apurado_vezes)}</span>
    </ChartTooltipFrame>
  )
}

/**
 * Série mensal do DEC acumulado no ano (zera em janeiro) contra o limite anual de referência.
 *
 * @param props - Pontos mensais devolvidos por `/quality/feeders/{id}/history`.
 * @returns Gráfico de linhas com legenda e tooltip detalhado.
 */
export function FeederTimeSeriesChart({ points }: { points: FeederHistoryPoint[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <ChartLegendItem label="DEC acumulado no ano (h)" series="chart-1" />
        <ChartLegendItem label="Limite anual de referência (h)" series="chart-5" />
      </div>
      <ChartContainer label="DEC acumulado no ano do alimentador contra o limite anual de referência">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="competencia" tickFormatter={formatCompetencia} tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={40} />
          <Tooltip content={<HistoryTooltip />} />
          <Line dataKey="dec_acumulado_ano_horas" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
          <Line dataKey="dec_limite_horas" stroke="var(--color-chart-5)" strokeDasharray="6 4" dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
