import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import { SummaryCard } from '@/features/loss_management/components/SummaryCard'
import type { HitRate } from '@/features/loss_management/types/lossTypes'
import { formatInteger, formatPercent, formatPeriod } from '@/features/loss_management/utils/lossFormatters'

const HIT_RATE_EXPLANATION =
  'Taxa = inspeções com irregularidade confirmada ÷ total de inspeções do histórico de campo. É a chance média de uma inspeção achar algo.'

interface HitRateCardProps {
  hitRate: HitRate
}

/**
 * Taxa histórica de acerto das inspeções, com a base de cálculo e o período coberto.
 *
 * @param props - Taxa histórica devolvida pelo resumo.
 * @returns Cartão com o percentual e a explicação; sem histórico de campo, avisa que usa a taxa geral já medida.
 */
export function HitRateCard({ hitRate }: HitRateCardProps) {
  const { inspecoes_total: total, irregularidades_confirmadas: confirmed, periodo_inicio: start, periodo_fim: end } = hitRate
  const hasHistory = total !== null && confirmed !== null
  const period = start && end ? ` · ${formatPeriod(start, end)}` : ''

  return (
    <SummaryCard
      title="Taxa de acerto histórica"
      action={(
        <Tooltip content={HIT_RATE_EXPLANATION}>
          <Button type="button" variant="link" size="sm">como calculamos</Button>
        </Tooltip>
      )}
    >
      <p className="text-foreground text-2xl font-bold">{formatPercent(hitRate.taxa)}</p>
      <p className="text-muted-foreground text-xs">
        {hasHistory
          ? `${formatInteger(confirmed)} de ${formatInteger(total)} inspeções com irregularidade confirmada${period}`
          : 'Histórico de campo indisponível: usando a taxa geral já medida nas inspeções.'}
      </p>
    </SummaryCard>
  )
}
