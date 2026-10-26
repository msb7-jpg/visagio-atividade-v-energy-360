import { Badge } from '@/components/ui/badge'
import type { QueueSituation } from '@/features/loss_management/types/lossTypes'

const SITUATION_LABELS: Record<QueueSituation, string> = {
  na_fila: 'Na fila',
  ordem_gerada: 'Ordem gerada',
  em_campo: 'Em campo'
}

const SITUATION_VARIANTS: Record<QueueSituation, 'secondary' | 'warning' | 'default'> = {
  na_fila: 'secondary',
  ordem_gerada: 'warning',
  em_campo: 'default'
}

interface QueueSituationBadgeProps {
  situation: QueueSituation
}

/**
 * Situação da UC na fila: livre, com ordem gerada ou já em campo.
 *
 * @param props - Situação devolvida pela API.
 * @returns Badge semântico da situação.
 */
export function QueueSituationBadge({ situation }: QueueSituationBadgeProps) {
  return <Badge variant={SITUATION_VARIANTS[situation]}>{SITUATION_LABELS[situation]}</Badge>
}
