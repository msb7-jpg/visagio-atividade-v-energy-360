import type { CSSProperties } from 'react'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SuspicionReason } from '@/features/loss_management/types/lossTypes'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'
import { formatConsumptionDrop, formatKwh, REASON_LABELS } from '@/features/loss_management/utils/lossFormatters'
import { cn } from '@/lib/utils'

const PERCENT_SCALE = 100

const REASON_VARIANT: Record<SuspicionReason, 'destructive' | 'warning'> = {
  queda_subita: 'destructive',
  queda_moderada: 'warning',
  leitura_zerada: 'destructive'
}

interface ConsumptionBarProps {
  label: string
  kwh: number
  scale: number
  barClass: string
}

function ConsumptionBar({ label, kwh, scale, barClass }: ConsumptionBarProps) {
  const width = `${Math.round((kwh / scale) * PERCENT_SCALE)}%`
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="text-foreground font-medium tabular-nums">{formatKwh(kwh)}/mês</dd>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
        <div className={cn('h-full w-(--bar-width) rounded-full', barClass)} style={{ '--bar-width': width } as CSSProperties} />
      </div>
    </div>
  )
}

interface UnitDropSummaryProps {
  detail: UnitDetail
}

/**
 * Por que a UC está na fila: os motivos, a queda em destaque e o consumo antes e agora lado a lado.
 * A frase completa do backend (ajuste pela carteira e taxa histórica de acerto) fica num detalhe recolhido.
 *
 * @param props - Detalhe da UC.
 * @returns Selos dos motivos, a queda, as duas barras de consumo e o detalhe do cálculo.
 */
export function UnitDropSummary({ detail }: UnitDropSummaryProps) {
  const { consumo_base_kwh: baseKwh, consumo_recente_kwh: recentKwh } = detail
  const scale = Math.max(baseKwh, recentKwh, 1)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {detail.motivos.map((reason) => (
          <Badge key={reason} variant={REASON_VARIANT[reason]}>{REASON_LABELS[reason]}</Badge>
        ))}
      </div>
      <div className="flex items-center gap-5">
        <div className="flex shrink-0 flex-col">
          <span className="text-destructive text-3xl font-semibold tabular-nums">{formatConsumptionDrop(baseKwh, recentKwh)}</span>
          <span className="text-muted-foreground text-xs">no consumo</span>
        </div>
        <dl className="flex min-w-0 flex-1 flex-col gap-2.5">
          <ConsumptionBar label="Antes (base)" kwh={baseKwh} scale={scale} barClass="bg-muted-foreground/50" />
          <ConsumptionBar label="Últimos 3 meses" kwh={recentKwh} scale={scale} barClass="bg-chart-1" />
        </dl>
      </div>
      <details className="group">
        <summary className="text-primary flex cursor-pointer list-none items-center gap-1 text-sm font-medium">
          <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
          Como a queda foi medida
        </summary>
        <p className="text-muted-foreground mt-2 text-sm">{detail.motivo_resumo}</p>
      </details>
    </div>
  )
}
