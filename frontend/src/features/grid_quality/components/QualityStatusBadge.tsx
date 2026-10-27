import { Badge } from '@/components/ui/badge'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'

const STATUS_BADGES: Record<QualityStatus, { label: string; variant: 'destructive' | 'outline' | 'secondary' }> = {
  violacao: { label: 'Acima do limite de referência', variant: 'destructive' },
  alerta: { label: 'Alerta (≥ 85% do limite)', variant: 'outline' },
  conforme: { label: 'Conforme', variant: 'secondary' }
}

/**
 * Selo do status regulatório de um alimentador.
 *
 * @param props - Status devolvido pela API.
 * @returns Badge com rótulo e variante do status.
 */
export function QualityStatusBadge({ status }: { status: QualityStatus }) {
  const { label, variant } = STATUS_BADGES[status]
  return <Badge variant={variant}>{label}</Badge>
}
