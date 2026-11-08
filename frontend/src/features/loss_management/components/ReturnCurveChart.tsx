import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartTooltipFrame } from '@/components/ui/chart'
import type { ReturnCurve, ReturnCurvePoint } from '@/features/loss_management/types/queueCurveTypes'
import { formatCurrency, formatInteger } from '@/features/loss_management/utils/lossFormatters'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }

function CurveTooltip({ active, payload }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as ReturnCurvePoint | undefined
  if (!active || !point) return null
  return (
    <ChartTooltipFrame title={`As ${formatInteger(point.posicao)} primeiras UCs`}>
      <span>
        {formatInteger(point.kwh_mes_acumulado)} kWh/mês · {formatCurrency(point.valor_ano_acumulado_rs)}/ano
      </span>
    </ChartTooltipFrame>
  )
}

interface ReturnCurveChartProps {
  curve: ReturnCurve
}

/**
 * Retorno esperado acumulado (kWh/mês) por número de UCs inspecionadas. A linha tracejada marca o corte sugerido.
 *
 * @param props - Curva devolvida pelo servidor, já reduzida a poucos pontos.
 * @returns Gráfico de linha com tooltip em kWh/mês e R$/ano.
 */
export function ReturnCurveChart({ curve }: ReturnCurveChartProps) {
  return (
    <ChartContainer
      className="h-48"
      label="Retorno esperado acumulado, em kWh por mês, conforme o número de UCs inspecionadas"
    >
      <LineChart data={curve.pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          type="number"
          dataKey="posicao"
          domain={[1, 'dataMax']}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={48} tickFormatter={formatInteger} />
        {curve.corte_sugerido ? (
          <ReferenceLine x={curve.corte_sugerido} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
        ) : null}
        <Tooltip content={<CurveTooltip />} />
        <Line
          dataKey="kwh_mes_acumulado"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
