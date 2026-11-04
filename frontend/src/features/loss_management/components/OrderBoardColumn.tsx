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
 * Coluna do quadro: selo da etapa, contagem e os cartões das ordens. Todas as colunas têm a mesma largura.
 * A lista tem altura máxima (~4 a 5 cartões) e rola por dentro, para o quadro manter tamanho padrão com muitas ordens.
 *
 * @param props - Etapa, ordens dela e callback das ações.
 * @returns Região nomeada com a lista de ordens da etapa.
 */
export function OrderBoardColumn({ column, orders, onAction }: OrderBoardColumnProps) {
  return (
    <section
      aria-label={`${column.label} (${orders.length})`}
      className="bg-muted/40 border-border flex min-w-0 flex-col gap-2.5 rounded-lg border p-3"
    >
      <header className="flex items-center justify-between">
        <StatusBadge kind="ordem" status={column.badge} />
        <span className="text-muted-foreground text-sm font-semibold tabular-nums">{orders.length}</span>
      </header>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-xs">Nenhuma ordem nesta etapa.</p>
      ) : (
        <ul className="flex max-h-144 flex-col gap-2.5 overflow-y-auto pr-1">
          {orders.map((order) => (
            <OrderCard key={order.id_inspecao} order={order} onAction={onAction} />
          ))}
        </ul>
      )}
    </section>
  )
}
