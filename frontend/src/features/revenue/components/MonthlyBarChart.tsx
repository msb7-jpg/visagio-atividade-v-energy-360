import { MotionConfig, motion } from 'motion/react'
import { Tooltip } from '@/components/ui/tooltip-card'
import { cn } from '@/lib/utils'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { formatCompetencia } from '@/features/revenue/utils/revenueFormatters'
import { toBarHeights } from '@/features/revenue/utils/revenueHistoryMetrics'
import type { HistoryMetric } from '@/features/revenue/utils/revenueHistoryMetrics'

interface MonthlyBarChartProps {
  points: MonthlyPoint[]
  metric: HistoryMetric
}

/**
 * Barras mensais do bairro. O valor do último mês fica em destaque e o de cada mês aparece ao passar o mouse;
 * uma tabela equivalente fica disponível para leitores de tela.
 *
 * @param props - Série mensal (não vazia) e métrica exibida (rótulo e formatação).
 * @returns Destaque do último mês, barras animadas e eixo com o primeiro e o último mês.
 */
export function MonthlyBarChart({ points, metric }: MonthlyBarChartProps) {
  const heights = toBarHeights(points, metric.key)
  const last = points[points.length - 1]
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs font-semibold">
            {metric.seriesLabel} · {formatCompetencia(last.competencia)}
          </span>
          <span className="text-foreground text-2xl font-bold tracking-tight">{metric.format(last[metric.key])}</span>
        </div>
        <div role="img" aria-label={`${metric.seriesLabel} dos últimos meses`} className="flex h-48 items-end gap-1">
          {points.map((point, index) => (
            <Tooltip
              key={point.competencia}
              containerClassName="flex h-full flex-1 items-end"
              content={(
                <span className="text-xs font-semibold">
                  {formatCompetencia(point.competencia)}: {metric.format(point[metric.key])}
                </span>
              )}
            >
              <motion.span
                className={cn('block w-full rounded-lg', index === points.length - 1 ? 'bg-primary' : 'bg-chart-2')}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heights[index], 2)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </Tooltip>
          ))}
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{formatCompetencia(points[0].competencia)}</span>
          <span>{formatCompetencia(last.competencia)}</span>
        </div>
        <table className="sr-only">
          <caption>{metric.seriesLabel} por mês</caption>
          <tbody>
            {points.map((point) => (
              <tr key={point.competencia}>
                <th scope="row">{formatCompetencia(point.competencia)}</th>
                <td>{metric.format(point[metric.key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MotionConfig>
  )
}
