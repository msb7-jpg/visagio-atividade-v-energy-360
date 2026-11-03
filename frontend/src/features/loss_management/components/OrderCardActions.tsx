import { Button } from '@/components/ui/button'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { ACTION_LABELS, formatOrderCode, type OrderActionKind } from '@/features/loss_management/utils/orderBoard'

interface OrderCardActionsProps {
  order: InspectionOrder
  actions: readonly OrderActionKind[]
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Ações do cartão em uma linha: a ação da etapa em botão cheio e o cancelamento em botão discreto ao lado
 * (o cancelamento sempre abre um diálogo com motivo, então o clique acidental não cancela nada).
 *
 * @param props - Ordem, ações que a etapa e o perfil permitem e callback da ação escolhida.
 * @returns Linha com os botões; nada quando não há ação.
 */
export function OrderCardActions({ order, actions, onAction }: OrderCardActionsProps) {
  const orderCode = formatOrderCode(order)
  if (actions.length === 0) return null

  return (
    <div className="flex items-center gap-2 pt-1">
      {actions.map((kind) => (
        <Button
          key={kind}
          type="button"
          size="sm"
          variant={kind === 'cancel' ? 'ghost' : 'default'}
          aria-label={`${ACTION_LABELS[kind]} ${orderCode}`}
          onClick={() => onAction(kind, order)}
        >
          {ACTION_LABELS[kind]}
        </Button>
      ))}
    </div>
  )
}
