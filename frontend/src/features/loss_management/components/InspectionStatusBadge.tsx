import { Badge } from '@/components/ui/badge'
import type { InspectionStatus } from '@/features/loss_management/types/lossTypes'
import { STATUS_LABELS } from '@/features/loss_management/utils/lossFormatters'

const STATUS_BADGE_VARIANT: Record<InspectionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  gerada: 'outline',
  pendente: 'default',
  concluida: 'secondary',
  cancelada: 'destructive'
}

interface InspectionStatusBadgeProps {
  status: InspectionStatus
}

/**
 * Badge semântico do status da ordem de inspeção.
 *
 * @param props - Status da ordem.
 * @returns Badge com rótulo e variante do status.
 */
export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}
