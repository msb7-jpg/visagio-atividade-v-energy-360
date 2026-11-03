import { CartesianGrid, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartTooltipFrame } from '@/components/ui/chart'
import type { MonthlyConsumption } from '@/features/loss_management/types/unitDetailTypes'
import { formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { findScoreWindows } from '@/features/loss_management/utils/scoreWindows'
import { formatCompetenciaLabel } from '@/features/loss_management/utils/unitDetailFormat'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }
const MIN_TICK_GAP = 16
const SPARSE_DOT_LIMIT = 24
const BASE_AREA_OPACITY = 0.08
const RECENT_AREA_OPACITY = 0.18

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
  /** Série desde a primeira leitura da UC; afeta só os textos, o gráfico desenha o que recebe. */
  fullHistory?: boolean
}

/**
 * Consumo mensal da UC (12 meses ou histórico completo), com a janela do score sombreada.
 * Mês sem leitura vem nulo e aparece como lacuna na linha, nunca como zero.
 *
 * @param props - Competências em ordem crescente e se a série é o histórico completo.
 * @returns Gráfico de linha com tooltip em kWh e legenda das faixas, ou aviso quando nenhum mês tem leitura.
 */
export function UnitConsumptionChart({ months, fullHistory = false }: UnitConsumptionChartProps) {
  const periodText = fullHistory ? 'no histórico da UC' : 'nos últimos 12 meses'
  if (months.every((month) => month.consumo_kwh === null)) {
    return <p className="text-muted-foreground text-sm">Sem leituras {periodText}.</p>
  }
  const windows = findScoreWindows(months)
  return (
    <>
      <ChartContainer className="h-56" label={`Consumo mensal da UC ${periodText}, em kWh`}>
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
          {windows?.base ? (
            <ReferenceArea
              x1={windows.base.first}
              x2={windows.base.last}
              fill="var(--color-muted-foreground)"
              fillOpacity={BASE_AREA_OPACITY}
              ifOverflow="visible"
            />
          ) : null}
          {windows ? (
            <ReferenceArea
              x1={windows.recent.first}
              x2={windows.recent.last}
              fill="var(--color-chart-1)"
              fillOpacity={RECENT_AREA_OPACITY}
              ifOverflow="visible"
            />
          ) : null}
          <Tooltip content={<ConsumptionTooltip />} />
          <Line
            dataKey="consumo_kwh"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            dot={months.length > SPARSE_DOT_LIMIT ? false : { r: 3, fill: 'var(--color-chart-1)' }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-xs">
        Faixa escura: 3 últimos meses (consumo recente do score). Faixa clara: 12 meses anteriores (base do score).
      </p>
    </>
  )
}
