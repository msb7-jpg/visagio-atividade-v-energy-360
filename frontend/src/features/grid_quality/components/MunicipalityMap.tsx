import { Cell, LabelList, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartTooltipFrame } from '@/components/ui/chart'
import { DEC_BANDS, bandOf } from '@/features/grid_quality/utils/continuityBands'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'

const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }

function MapTooltip({ active, payload }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as MunicipalityDec | undefined
  if (!active || !point) {
    return null
  }
  return (
    <ChartTooltipFrame title={point.name}>
      <span>DEC: {formatDecimal(point.decHours)} h ({bandOf(point.decHours).label})</span>
    </ChartTooltipFrame>
  )
}

/**
 * Mapa esquemático: um círculo por município, posicionado por latitude e longitude e colorido pela faixa de DEC.
 *
 * @param props - Municípios com DEC do período B.
 * @returns Gráfico de dispersão com legenda das faixas.
 */
export function MunicipalityMap({ municipalities }: { municipalities: MunicipalityDec[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        {DEC_BANDS.map((band) => (
          <span key={band.label} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className={`${band.swatch} size-2.5 rounded-full`} />
            {band.label}
          </span>
        ))}
      </div>
      <ChartContainer label="Mapa esquemático do DEC por município" className="h-80">
        <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <XAxis type="number" dataKey="longitude" name="Longitude" domain={['dataMin - 0.1', 'dataMax + 0.1']} tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={(value: number) => `${formatDecimal(value)}°`} />
          <YAxis type="number" dataKey="latitude" name="Latitude" domain={['dataMin - 0.1', 'dataMax + 0.1']} tickLine={false} axisLine={false} tick={AXIS_TICK} width={48} tickFormatter={(value: number) => `${formatDecimal(value)}°`} />
          <Tooltip content={<MapTooltip />} cursor={false} />
          <Scatter data={municipalities} shape="circle">
            {municipalities.map((municipality) => (
              <Cell key={municipality.name} fill={bandOf(municipality.decHours).fill} />
            ))}
            <LabelList dataKey="name" position="top" fill="var(--color-foreground)" fontSize={11} />
          </Scatter>
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
