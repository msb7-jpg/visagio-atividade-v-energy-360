import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareBar } from '@/features/grid_quality/components/ShareBar'
import { formatPercent, labelOccurrence } from '@/features/grid_quality/utils/continuityFormatters'
import type { CauseShare } from '@/features/grid_quality/types/continuityTypes'
import type { PeriodLabels } from '@/features/grid_quality/utils/periodLabels'

/**
 * Bloco "Interrupções por causa": participação de cada causa nas UC-horas do período B.
 * Causa vazia na origem chega da API como "Sem causa registrada", separada de `NAO IDENTIFICADA`.
 *
 * @param props - Causas ordenadas pela participação e os textos dos períodos.
 * @returns Card com barras e selo de causa atacável ou não.
 */
export function CauseSharesCard({ causes, periods }: { causes: CauseShare[]; periods: PeriodLabels }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Interrupções por causa</CardTitle>
        <CardDescription>% das UC-horas de {periods.current}. Atacável: a manutenção preventiva consegue evitar.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {causes.map((cause) => (
            <li key={cause.cause} className="flex items-center gap-3 text-sm">
              <span className="text-foreground flex w-64 shrink-0 items-center gap-2">
                {labelOccurrence(cause.cause)}
                <Badge variant={cause.actionable ? 'default' : 'outline'}>{cause.actionable ? 'atacável' : 'não atacável'}</Badge>
              </span>
              <ShareBar percent={cause.sharePercent} tone={cause.actionable ? 'bg-warning' : 'bg-chart-4'} />
              <span className="text-foreground w-16 shrink-0 text-right font-bold">{formatPercent(cause.sharePercent)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
