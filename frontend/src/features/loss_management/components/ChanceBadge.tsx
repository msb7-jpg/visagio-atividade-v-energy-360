import { Badge } from '@/components/ui/badge'
import { formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { PRIORITY_MIN_HIT_PROBABILITY } from '@/features/loss_management/utils/queueBands'

interface ChanceBadgeProps {
  /** Chance de a inspeção achar irregularidade (0 a 1), a mesma que decide a faixa da fila. */
  probability: number
}

/**
 * Selo da chance de acerto da UC: verde quando atinge o corte da faixa prioritária, neutro abaixo dele.
 *
 * @param props - Chance de acerto entre 0 e 1.
 * @returns Selo com a porcentagem; a cor reforça a faixa, o número continua sendo a informação.
 */
export function ChanceBadge({ probability }: ChanceBadgeProps) {
  const isPriority = probability >= PRIORITY_MIN_HIT_PROBABILITY
  return (
    <Badge variant={isPriority ? 'success' : 'outline'}>{formatPercent(probability)}</Badge>
  )
}
