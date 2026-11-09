import type { CSSProperties } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaHealthList } from '@/features/executive_dashboard/components/AreaHealthList'
import type { IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { countEvaluations } from '@/features/executive_dashboard/utils/dashboardSummary'
import { EVALUATION_ICONS, EVALUATION_ORDER, EVALUATIONS } from '@/features/executive_dashboard/utils/indicatorTrend'
import { cn } from '@/lib/utils'

/**
 * Placar do período: quantos indicadores melhoraram, ficaram estáveis ou pioraram, a mesma conta numa
 * barra segmentada e a situação de cada área. Responde "estamos indo bem ou mal?" antes de qualquer número.
 * Só conta as avaliações que o backend já fez; não recalcula nada. O total vai no rótulo acessível da barra.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Card com as contagens, a barra e a lista de áreas.
 */
export function ScoreboardPanel({ groups }: { groups: IndicatorGroup[] }) {
  const counts = countEvaluations(groups)
  const statuses = EVALUATION_ORDER.filter((status) => counts[status] > 0)
  const total = statuses.reduce((sum, status) => sum + counts[status], 0)
  const summary = statuses.map((status) => `${counts[status]} ${EVALUATIONS[status].plural.toLowerCase()}`).join(', ')

  return (
    <Card data-testid="dashboard-scoreboard" className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Placar do período</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          {statuses.map((status) => {
            const Icon = EVALUATION_ICONS[status]
            return (
              <div key={status} data-testid={`score-${status}`} className="flex flex-col-reverse">
                <dt className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                  <Icon aria-hidden="true" className={cn('size-3.5', EVALUATIONS[status].textColor)} />
                  {EVALUATIONS[status].plural}
                </dt>
                <dd className="text-foreground text-3xl font-semibold tabular-nums">{counts[status]}</dd>
              </div>
            )
          })}
        </dl>
        <div
          role="img"
          aria-label={`${total} indicadores: ${summary}`}
          className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sm"
        >
          {statuses.map((status) => (
            <div
              key={status}
              className={cn('h-full w-(--segment-width)', EVALUATIONS[status].barColor)}
              style={{ '--segment-width': `${(counts[status] / total) * 100}%` } as CSSProperties}
            />
          ))}
        </div>
        <AreaHealthList groups={groups} />
      </CardContent>
    </Card>
  )
}
