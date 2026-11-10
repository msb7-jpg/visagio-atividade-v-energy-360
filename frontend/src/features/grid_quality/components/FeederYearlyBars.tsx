import type { CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import type { FeederHistoryPoint } from '@/features/grid_quality/types/qualityTypes'
import { isPartialYear, yearlyDec } from '@/features/grid_quality/utils/feederSummary'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { cn } from '@/lib/utils'

/**
 * DEC de cada ano civil numa barra, todas na mesma escala, com a marca do limite anual de referência.
 * Ano acima do limite fica em vermelho; anos com menos de 12 meses de dado levam o selo "parcial".
 *
 * @param props - Série mensal do alimentador.
 * @returns Uma linha por ano, do mais recente para o mais antigo.
 */
export function FeederYearlyBars({ points }: { points: FeederHistoryPoint[] }) {
  const years = yearlyDec(points).reverse()
  const scale = Math.max(...years.map((feederYear) => Math.max(feederYear.decHours, feederYear.limitHours ?? 0)), 1)
  const limits = [...new Set(years.map((feederYear) => feederYear.limitHours).filter((limit) => limit !== null))]
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5" aria-label="DEC por ano">
        {years.map((feederYear) => {
          const isAbove = feederYear.limitHours !== null && feederYear.decHours > feederYear.limitHours
          const style = {
            '--bar-width': `${(feederYear.decHours / scale) * 100}%`,
            '--limit-left': `${((feederYear.limitHours ?? 0) / scale) * 100}%`
          } as CSSProperties
          return (
            <li key={feederYear.year} className="grid grid-cols-12 items-center gap-3">
              <span className="text-foreground col-span-2 text-sm font-medium tabular-nums">{feederYear.year}</span>
              <div className="bg-muted relative col-span-6 h-2.5 rounded-full" style={style} aria-hidden="true">
                <div className={cn('h-full w-(--bar-width) rounded-full', isAbove ? 'bg-destructive' : 'bg-chart-1')} />
                {feederYear.limitHours === null ? null : <div className="bg-foreground absolute -inset-y-1 left-(--limit-left) w-0.5 rounded-full" />}
              </div>
              <span className="col-span-4 flex items-center justify-end gap-2 text-sm tabular-nums">
                {isPartialYear(feederYear) ? <Badge variant="muted">{feederYear.months} meses</Badge> : null}
                <strong className="font-semibold">{formatDecimal(feederYear.decHours)} h</strong>
              </span>
            </li>
          )
        })}
      </ul>
      {limits.length > 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <span aria-hidden="true" className="bg-foreground h-3.5 w-0.5 rounded-full" />
          Limite anual de referência: {limits.map((limit) => `${formatDecimal(limit)} h`).join(' / ')}. Barra vermelha passou do limite.
        </p>
      ) : null}
    </div>
  )
}
