import { ShareBar } from '@/components/data/ShareBar'
import type { ReasonBacktest } from '@/features/loss_management/types/backtestTypes'
import { REASON_LABELS, formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const PERCENT = 100

interface ReasonRateBarsProps {
  reasons: ReasonBacktest[]
  minimumSample: number
}

/**
 * Taxa de acerto por motivo, com o n de cada barra; motivo com amostra pequena não mostra taxa.
 *
 * @param props - Taxas por motivo do backtest e o mínimo de inspeções para mostrá-las.
 * @returns Uma barra por motivo, ou a mensagem de vazio.
 */
export function ReasonRateBars({ reasons, minimumSample }: ReasonRateBarsProps) {
  if (reasons.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem inspeções suficientes para calcular.</p>
  }
  return (
    <ul className="flex flex-col gap-3">
      {reasons.map((reason) => {
        const sampleLabel = `n = ${formatInteger(reason.inspecionadas)}`
        const showRate = reason.amostra_suficiente && reason.taxa !== null
        return (
          <li key={reason.motivo} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>{REASON_LABELS[reason.motivo]}</span>
              <span className="text-muted-foreground">
                {showRate && reason.taxa !== null
                  ? `${formatPercent(reason.taxa)} · ${sampleLabel}`
                  : `sem inspeções suficientes (${sampleLabel}, mínimo ${formatInteger(minimumSample)})`}
              </span>
            </div>
            {showRate && reason.taxa !== null ? <ShareBar percent={reason.taxa * PERCENT} /> : null}
          </li>
        )
      })}
    </ul>
  )
}
