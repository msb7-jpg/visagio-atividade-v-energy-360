import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
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

const AVERAGE_DASH = '4 3'

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${swatch}`} aria-hidden="true" />
      {label}
    </li>
  )
}

/** Médias que o score compara: a da base e a dos 3 últimos meses. */
interface WindowAverages {
  baseKwh: number
  recentKwh: number
}

interface UnitConsumptionChartProps {
  months: MonthlyConsumption[]
  /** Desenha a média de cada janela como linha tracejada sobre a faixa. */
  averages?: WindowAverages
  /** Série desde a primeira leitura da UC; afeta só os textos, o gráfico desenha o que recebe. */
  fullHistory?: boolean
}

/**
 * Consumo mensal da UC (12 meses ou histórico completo), com a janela do score sombreada.
 * Mês sem leitura vem nulo e aparece como lacuna na linha, nunca como zero.
 *
 * @param props - Competências em ordem crescente e se a série é o histórico completo.
 * @returns Gráfico de linha com tooltip em kWh, médias tracejadas e legenda das faixas, ou aviso quando nenhum mês tem leitura.
 */
export function UnitConsumptionChart({ months, averages, fullHistory = false }: UnitConsumptionChartProps) {
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
          {windows?.base && averages ? (
            <ReferenceLine
              segment={[{ x: windows.base.first, y: averages.baseKwh }, { x: windows.base.last, y: averages.baseKwh }]}
              stroke="var(--color-muted-foreground)"
              strokeDasharray={AVERAGE_DASH}
            />
          ) : null}
          {windows && averages ? (
            <ReferenceLine
              segment={[{ x: windows.recent.first, y: averages.recentKwh }, { x: windows.recent.last, y: averages.recentKwh }]}
              stroke="var(--color-chart-1)"
              strokeDasharray={AVERAGE_DASH}
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
      <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <LegendItem swatch="bg-muted-foreground/20" label="Base do score (12 meses)" />
        <LegendItem swatch="bg-chart-1/30" label="Últimos 3 meses" />
        {averages ? <li className="flex items-center gap-1.5"><span className="border-muted-foreground w-3 border-t-2 border-dashed" aria-hidden="true" />Média da faixa</li> : null}
      </ul>
    </>
  )
}
