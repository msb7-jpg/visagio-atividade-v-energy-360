import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShareBar } from '@/features/grid_quality/components/ShareBar'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { formatInteger, labelOccurrence } from '@/features/grid_quality/utils/continuityFormatters'
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
 * Com causa ativa e o mês dentro do padrão para ela, o texto fica neutro; com mediana zero não há "N vezes".
 *
 * @param props - Evento detectado pela API na rede inteira e a causa filtrada (vazia = todas).
 * @returns Card com texto e barras comparativas.
 */
export function ContinuityEventCard({ event, cause }: { event: ContinuityEvent; cause: string }) {
  const label = formatCompetencia(event.competencia)
  const maximum = Math.max(event.eventInterruptions, event.otherMonthsMedian)
  const neutral = cause !== '' && !event.extremeInScope
  const comparison =
    event.otherMonthsMedian === 0
      ? 'os outros meses não tiveram ocorrências'
      : `${formatDecimal(event.eventInterruptions / event.otherMonthsMedian)} vezes a mediana dos outros meses (${formatInteger(event.otherMonthsMedian)})`
  return (
    <Card variant="glass">
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={neutral ? 'muted' : 'warning'}>{neutral ? 'Mês do evento na rede' : 'Evento fora do padrão'}</Badge>
            <h2 className="text-foreground text-base font-bold">
              {neutral ? `${label} está dentro do padrão para ${labelOccurrence(cause)}` : `${label} concentra a piora`}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {label} teve {formatInteger(event.eventInterruptions)} interrupções, {comparison}. Sem esse mês, o DEC do período B fica em {formatDecimal(event.decWithoutEvent)} h
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
