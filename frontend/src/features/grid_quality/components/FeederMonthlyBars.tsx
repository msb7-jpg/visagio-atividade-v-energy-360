import type { CSSProperties } from 'react'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { FeederHistoryPoint } from '@/features/grid_quality/types/qualityTypes'
import { lastMonths, worstMonth } from '@/features/grid_quality/utils/feederSummary'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { formatMonth } from '@/lib/periods/periodPresets'
import { cn } from '@/lib/utils'

/**
 * Horas sem energia de cada um dos últimos 12 meses em colunas, com o pior mês destacado e citado abaixo.
 * O tooltip de cada coluna traz o DEC e o FEC do mês.
 *
 * @param props - Série mensal do alimentador.
 * @returns Colunas mensais e a linha com o pior mês.
 */
export function FeederMonthlyBars({ points }: { points: FeederHistoryPoint[] }) {
  const months = lastMonths(points)
  const worst = worstMonth(months)
  const scale = Math.max(worst?.dec_apurado_horas ?? 0, 1)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-28 items-end gap-1" role="img" aria-label="Horas sem energia por mês nos últimos 12 meses">
        {months.map((point) => (
          <Tooltip
            key={point.competencia}
            containerClassName="flex h-full flex-1 flex-col justify-end"
            content={(
              <span className="flex flex-col">
                <span className="font-medium">{formatMonth(point.competencia)}</span>
                <span>{formatDecimal(point.dec_apurado_horas)} h sem energia</span>
                <span className="text-muted-foreground">{formatDecimal(point.fec_apurado_vezes)} interrupções por cliente</span>
              </span>
            )}
          >
            <div
              className={cn('h-(--bar-height) min-h-0.5 rounded-t-sm', point === worst ? 'bg-destructive' : 'bg-chart-1')}
              style={{ '--bar-height': `${(point.dec_apurado_horas / scale) * 100}%` } as CSSProperties}
            />
          </Tooltip>
        ))}
      </div>
      <div className="text-muted-foreground flex gap-1 text-xs" aria-hidden="true">
        {months.map((point) => (
          <span key={point.competencia} className="flex-1 text-center">{formatMonth(point.competencia).slice(0, 3)}</span>
        ))}
      </div>
      {worst ? (
        <p className="text-muted-foreground text-xs">
          Pior mês: <span className="text-foreground font-medium">{formatMonth(worst.competencia)}</span>, com {formatDecimal(worst.dec_apurado_horas)} h
        </p>
      ) : null}
    </div>
  )
}
