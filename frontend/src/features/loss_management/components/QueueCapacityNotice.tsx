import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { describeCapacityGap } from '@/features/loss_management/utils/queueOutlook'

function describeLowChance(count: number, maxRate: number): string {
  if (count === 0) return 'Não há outras UCs suspeitas na fila.'
  const subject = count === 1 ? 'UC de baixa chance acerta' : 'UCs de baixa chance acertam'
  return `${formatInteger(count)} ${subject} no máximo ${formatPercent(maxRate)}: completar a capacidade com elas manda a equipe a campo sem retorno.`
}

interface QueueCapacityNoticeProps {
  units: SuspiciousUnit[]
  /** Inspeções que a equipe faz por mês. */
  capacity: number
}

/**
 * Avisa quando a fila não tem UCs prioritárias para ocupar a capacidade da equipe.
 *
 * Completar a capacidade com UCs de baixa chance mandaria a equipe a campo sem retorno; o gerente decide sabendo.
 *
 * @param props - UCs da fila e a capacidade mensal de inspeções.
 * @returns Alerta com as prioritárias contra a capacidade, ou nada quando elas enchem a capacidade.
 */
export function QueueCapacityNotice({ units, capacity }: QueueCapacityNoticeProps) {
  const gap = describeCapacityGap(units, capacity)
  if (!gap) return null
  const { priorityCount, lowChanceCount, lowChanceMaxRate } = gap

  return (
    <Alert variant="warning">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <AlertTitle>
          {formatInteger(priorityCount)} {priorityCount === 1 ? 'UC prioritária' : 'UCs prioritárias'} para uma capacidade
          de {formatInteger(capacity)} inspeções por mês
        </AlertTitle>
        <AlertDescription>{describeLowChance(lowChanceCount, lowChanceMaxRate)}</AlertDescription>
      </div>
    </Alert>
  )
}
