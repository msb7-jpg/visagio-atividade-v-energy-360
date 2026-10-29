import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShareBar } from '@/features/grid_quality/components/ShareBar'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { formatInteger } from '@/features/grid_quality/utils/continuityFormatters'
import type { ContinuityEvent } from '@/features/grid_quality/types/continuityTypes'

function ComparisonBar({ label, value, maximum, tone }: { label: string; value: number; maximum: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <ShareBar percent={maximum === 0 ? 0 : (value / maximum) * 100} tone={tone} />
      <span className="text-foreground w-14 text-right font-bold">{formatInteger(value)}</span>
    </div>
  )
}

/**
 * Destaque do mês fora do padrão: quanto ele pesa e como ficam DEC e FEC sem ele.
 *
 * @param props - Evento detectado pela API na rede inteira.
 * @returns Card com texto e barras comparativas.
 */
export function ContinuityEventCard({ event }: { event: ContinuityEvent }) {
  const label = formatCompetencia(event.competencia)
  const maximum = Math.max(event.eventInterruptions, event.otherMonthsMedian)
  const ratio = event.otherMonthsMedian === 0 ? 0 : event.eventInterruptions / event.otherMonthsMedian
  return (
    <Card variant="glass">
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="warning">Evento fora do padrão</Badge>
            <h2 className="text-foreground text-base font-bold">{label} concentra a piora</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {label} teve {formatInteger(event.eventInterruptions)} interrupções, {formatDecimal(ratio)} vezes a mediana dos outros
            meses ({formatInteger(event.otherMonthsMedian)}). Sem esse mês, o DEC do período B fica em {formatDecimal(event.decWithoutEvent)} h
            e o FEC em {formatDecimal(event.fecWithoutEvent)}.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <ComparisonBar label={label} value={event.eventInterruptions} maximum={maximum} tone="bg-destructive" />
          <ComparisonBar label="Mediana dos outros meses" value={event.otherMonthsMedian} maximum={maximum} tone="bg-chart-4" />
        </div>
      </CardContent>
    </Card>
  )
}
