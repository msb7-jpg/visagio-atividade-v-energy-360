import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartTooltipFrame } from '@/components/ui/chart'
import type { MonthlyConsumption } from '@/features/loss_management/types/unitDetailTypes'
import { formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { formatCompetenciaLabel } from '@/features/loss_management/utils/unitDetailFormat'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }
const MIN_TICK_GAP = 16

function ConsumptionTooltip({ active, payload }: TooltipProps<number, string>) {
  const month = payload?.[0]?.payload as MonthlyConsumption | undefined
  if (!active || !month) return null
  return (
    <ChartTooltipFrame title={formatCompetenciaLabel(month.competencia)}>
      <span>{month.consumo_kwh === null ? 'Sem leitura neste mês' : formatKwh(month.consumo_kwh)}</span>
    </ChartTooltipFrame>
  )
}

interface UnitConsumptionChartProps {
  months: MonthlyConsumption[]
}

/**
 * Consumo mensal dos últimos 12 meses da UC. Mês sem leitura vem nulo e aparece como lacuna na linha, nunca como zero.
 *
 * @param props - 12 competências em ordem crescente.
 * @returns Gráfico de linha com tooltip em kWh, ou aviso quando nenhum mês tem leitura.
 */
export function UnitConsumptionChart({ months }: UnitConsumptionChartProps) {
  if (months.every((month) => month.consumo_kwh === null)) {
    return <p className="text-muted-foreground text-sm">Sem leituras nos últimos 12 meses.</p>
  }
  return (
    <ChartContainer className="h-56" label="Consumo mensal da UC nos últimos 12 meses, em kWh">
      <LineChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="competencia"
          tickFormatter={formatCompetenciaLabel}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={MIN_TICK_GAP}
        />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={48} />
        <Tooltip content={<ConsumptionTooltip />} />
        <Line
          dataKey="consumo_kwh"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-chart-1)' }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
