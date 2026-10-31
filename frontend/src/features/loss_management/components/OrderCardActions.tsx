import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { ACTION_LABELS, formatOrderCode, type OrderActionKind } from '@/features/loss_management/utils/orderBoard'

interface OrderCardActionsProps {
  order: InspectionOrder
  actions: readonly OrderActionKind[]
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Ações do cartão: a ação da etapa em botão e o cancelamento no menu "⋯", longe do clique acidental.
 *
 * @param props - Ordem, ações que a etapa e o perfil permitem e callback da ação escolhida.
 * @returns Linha com o botão principal e o menu; nada quando não há ação.
 */
export function OrderCardActions({ order, actions, onAction }: OrderCardActionsProps) {
  const primaryAction = actions.find((kind) => kind !== 'cancel')
  const canCancel = actions.includes('cancel')
  const orderCode = formatOrderCode(order)
  if (!primaryAction && !canCancel) return null

  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      {primaryAction ? (
        <Button
          type="button"
          size="sm"
          aria-label={`${ACTION_LABELS[primaryAction]} ${orderCode}`}
          onClick={() => onAction(primaryAction, order)}
        >
          {ACTION_LABELS[primaryAction]}
        </Button>
      ) : <span />}
      {canCancel ? (
        // Sem `modal`: o diálogo de cancelamento abre logo após o item e não pode herdar o bloqueio do menu.
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="icon" variant="ghost" aria-label={`Mais ações ${orderCode}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem aria-label={`${ACTION_LABELS.cancel} ${orderCode}`} onSelect={() => onAction('cancel', order)}>
              {ACTION_LABELS.cancel} ordem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
