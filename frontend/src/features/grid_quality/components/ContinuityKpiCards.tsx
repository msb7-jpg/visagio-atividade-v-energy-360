import { ArrowDown, ArrowUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { formatHoursMinutes, formatInteger } from '@/features/grid_quality/utils/continuityFormatters'
import type { ContinuityKpis, PeriodComparison } from '@/features/grid_quality/types/continuityTypes'
import type { PeriodLabels } from '@/features/grid_quality/utils/periodLabels'

interface ComparisonCardProps {
  title: string
  formula: string
  value: string
  previousValue: string
  previousLabel: string
  comparison: PeriodComparison
}

function ComparisonCard({ title, formula, value, previousValue, previousLabel, comparison }: ComparisonCardProps) {
  const worse = comparison.changePercent > 0
  const Arrow = worse ? ArrowUp : ArrowDown
  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <Tooltip content={formula}>
          <CardTitle className="cursor-help">{title}</CardTitle>
        </Tooltip>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-foreground text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-2">
          <Badge variant={worse ? 'destructive' : 'secondary'}>
            <Arrow className="mr-1 size-3" aria-hidden="true" />
            {formatDecimal(Math.abs(comparison.changePercent))}%
          </Badge>
          <CardDescription>{previousLabel}: {previousValue} · {worse ? 'piora' : 'melhora'}</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quatro cards do período B com a variação sobre o período A: DEC, FEC, interrupções e duração média.
 *
 * @param props - Indicadores comparados dos dois períodos e os textos com as datas de cada um.
 * @returns Grade de cards.
 */
export function ContinuityKpiCards({ kpis, periods }: { kpis: ContinuityKpis; periods: PeriodLabels }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ComparisonCard
        title="DEC simplificado (h por UC)"
        formula="Soma das horas de interrupção dividida pelas UCs atendidas, ponderada entre alimentadores. Serve para comparar alimentadores e períodos entre si."
        value={`${formatDecimal(kpis.dec.current)} h`}
        previousValue={`${formatDecimal(kpis.dec.previous)} h`}
        previousLabel={periods.previous}
        comparison={kpis.dec}
      />
      <ComparisonCard
        title="FEC simplificado (por UC)"
        formula="UCs interrompidas divididas pelas UCs atendidas, ponderada entre alimentadores."
        value={formatDecimal(kpis.fec.current)}
        previousValue={formatDecimal(kpis.fec.previous)}
        previousLabel={periods.previous}
        comparison={kpis.fec}
      />
      <ComparisonCard
        title="Nº de interrupções"
        formula="Linhas de ocorrência no período; cada linha é uma UC interrompida."
        value={formatInteger(kpis.interruptions.current)}
        previousValue={formatInteger(kpis.interruptions.previous)}
        previousLabel={periods.previous}
        comparison={kpis.interruptions}
      />
      <ComparisonCard
        title="Duração média"
        formula="UC-horas interrompidas divididas pelo número de interrupções."
        value={formatHoursMinutes(kpis.averageDurationHours.current)}
        previousValue={formatHoursMinutes(kpis.averageDurationHours.previous)}
        previousLabel={periods.previous}
        comparison={kpis.averageDurationHours}
      />
    </div>
  )
}
