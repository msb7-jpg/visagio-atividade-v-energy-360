import type { CSSProperties } from 'react'
import { SummaryCard } from '@/features/loss_management/components/SummaryCard'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'
import { cn } from '@/lib/utils'

const PERCENT = 100

interface CapacityCardProps {
  summary: QueueSummary
}

const toPercent = (part: number, total: number) => (total > 0 ? `${Math.min(PERCENT, (part / total) * PERCENT)}%` : '0%')

/**
 * Capacidade do mês: ordens já programadas somadas às UCs selecionadas, contra o que a equipe faz por mês.
 *
 * @param props - Resumo da seleção atual.
 * @returns Cartão com o total usado, a barra de capacidade e o que ainda cabe (ou quanto passou).
 */
export function CapacityCard({ summary }: CapacityCardProps) {
  const { capacidade_total: total, capacidade_programada: scheduled, selecionadas: selected } = summary
  const used = scheduled + selected
  const remaining = total - used
  const isOverCapacity = remaining < 0

  return (
    <SummaryCard title="Capacidade do mês">
      <p className="flex items-baseline gap-1.5">
        <span className="text-foreground text-2xl font-bold">{formatInteger(used)}</span>
        <span className="text-muted-foreground text-sm">de {formatInteger(total)} inspeções</span>
      </p>
      <div
        role="progressbar"
        aria-label="Capacidade do mês usada"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(used, total)}
        className="bg-muted flex h-2 overflow-hidden rounded-full"
      >
        <div className="bg-primary/50 w-(--bar-width)" style={{ '--bar-width': toPercent(scheduled, total) } as CSSProperties} />
        <div className={cn('w-(--bar-width)', isOverCapacity ? 'bg-destructive' : 'bg-primary')} style={{ '--bar-width': toPercent(selected, total) } as CSSProperties} />
      </div>
      <p className={cn('text-xs', isOverCapacity ? 'text-destructive' : 'text-muted-foreground')}>
        {formatInteger(scheduled)} {scheduled === 1 ? 'programada' : 'programadas'} + {formatInteger(selected)}{' '}
        {selected === 1 ? 'selecionada' : 'selecionadas'} ·{' '}
        {isOverCapacity ? `passa da capacidade em ${formatInteger(-remaining)}` : `ainda cabem ${formatInteger(remaining)}`}
      </p>
    </SummaryCard>
  )
}
