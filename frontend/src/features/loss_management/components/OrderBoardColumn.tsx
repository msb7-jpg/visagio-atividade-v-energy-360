import { StatusBadge } from '@/components/ui/status-badge'
import { OrderCard } from '@/features/loss_management/components/OrderCard'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import type { BoardColumn, OrderActionKind } from '@/features/loss_management/utils/orderBoard'

interface OrderBoardColumnProps {
  column: BoardColumn
  orders: InspectionOrder[]
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Coluna do quadro: selo da etapa, contagem e os cartões das ordens (ou aviso de etapa vazia).
 *
 * @param props - Etapa, ordens dela e callback das ações.
 * @returns Região nomeada com a lista de ordens da etapa.
 */
export function OrderBoardColumn({ column, orders, onAction }: OrderBoardColumnProps) {
  return (
    <section aria-label={`${column.label} (${orders.length})`} className="bg-muted/40 flex flex-col gap-2.5 rounded-lg p-3">
      <header className="flex items-center justify-between">
        <StatusBadge kind="ordem" status={column.badge} />
        <span className="text-muted-foreground text-sm font-semibold tabular-nums">{orders.length}</span>
      </header>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-xs">Nenhuma ordem nesta etapa.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {orders.map((order) => (
            <OrderCard key={order.id_inspecao} order={order} onAction={onAction} />
          ))}
        </ul>
      )}
    </section>
  )
}
