import { StatusBadge } from '@/components/ui/status-badge'
import type { QueueSituation } from '@/features/loss_management/types/lossTypes'

interface QueueSituationBadgeProps {
  situation: QueueSituation
}

/**
 * Situação da UC na fila: livre, com ordem gerada ou já em campo.
 *
 * @param props - Situação devolvida pela API.
 * @returns Selo semântico da situação.
 */
export function QueueSituationBadge({ situation }: QueueSituationBadgeProps) {
  return <StatusBadge kind="ordem" status={situation} />
}
