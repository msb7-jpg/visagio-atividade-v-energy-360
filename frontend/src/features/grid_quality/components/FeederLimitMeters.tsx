import type { CSSProperties } from 'react'
import { HelpCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'
import { gapToLimit } from '@/features/grid_quality/utils/feederSummary'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { cn } from '@/lib/utils'

const STATUS_BAR: Record<QualityStatus, string> = {
  violacao: 'bg-destructive',
  alerta: 'bg-warning',
  conforme: 'bg-success'
}

interface MeterProps {
  label: string
  hint: string
  value: number
  limit: number | null
  unit: string
  barClass: string
}

function describeGap(value: number, limit: number | null, unit: string): string {
  const gap = gapToLimit(value, limit)
  if (gap === null) return 'Sem limite de referência'
  if (gap > 0) return `${formatDecimal(gap)} ${unit} acima do limite`
  return `${formatDecimal(-gap)} ${unit} abaixo do limite`
}

function LimitMeter({ label, hint, value, limit, unit, barClass }: MeterProps) {
  const scale = Math.max(value, limit ?? 0, 1)
  const style = {
    '--bar-width': `${(value / scale) * 100}%`,
    '--limit-left': `${((limit ?? 0) / scale) * 100}%`
  } as CSSProperties
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Tooltip content={hint}>
          <span className="text-muted-foreground flex cursor-help items-center gap-1 text-sm">
            {label}
            <HelpCircle aria-hidden="true" className="size-3.5" />
          </span>
        </Tooltip>
        <span className="text-foreground text-sm tabular-nums">
          <strong className="text-lg font-semibold">{formatDecimal(value)}</strong> {unit}
          <span className="text-muted-foreground"> / limite {formatDecimal(limit)} {unit}</span>
        </span>
      </div>
      <div className="bg-muted relative h-2.5 rounded-full" style={style} aria-hidden="true">
        <div className={cn('h-full w-(--bar-width) rounded-full', barClass)} />
        {limit === null ? null : <div className="bg-foreground absolute -inset-y-1 left-(--limit-left) w-0.5 rounded-full" />}
      </div>
      <span className="text-muted-foreground text-xs">{describeGap(value, limit, unit)}</span>
    </div>
  )
}

interface FeederLimitMetersProps {
  status: QualityStatus | undefined
  decHours: number
  decLimit: number | null
  fecTimes: number
  fecLimit: number | null
}

/**
 * DEC e FEC acumulados no ano contra o limite anual de referência, em barras com a marca do limite.
 * A cor segue a situação devolvida pela API (acima do limite, alerta ou conforme).
 *
 * @param props - Acumulados, limites e situação do alimentador.
 * @returns As duas barras com o valor, o limite e a distância até ele.
 */
export function FeederLimitMeters({ status, decHours, decLimit, fecTimes, fecLimit }: FeederLimitMetersProps) {
  const barClass = status ? STATUS_BAR[status] : 'bg-chart-1'
  return (
    <div className="flex flex-col gap-4">
      <LimitMeter
        label="Horas sem energia (DEC)"
        hint="Horas sem energia por cliente, somadas desde janeiro. A marca vertical é o limite anual de referência."
        value={decHours}
        limit={decLimit}
        unit="h"
        barClass={barClass}
      />
      <LimitMeter
        label="Interrupções (FEC)"
        hint="Quantas vezes, em média, cada cliente ficou sem energia desde janeiro."
        value={fecTimes}
        limit={fecLimit}
        unit="vezes"
        barClass={barClass}
      />
    </div>
  )
}
