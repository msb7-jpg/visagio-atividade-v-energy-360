import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { OrderCard } from '@/features/loss_management/components/OrderCard'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import type { BoardColumn, OrderActionKind } from '@/features/loss_management/utils/orderBoard'
import { cn } from '@/lib/utils'

interface OrderBoardColumnProps {
  column: BoardColumn
  orders: InspectionOrder[]
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Coluna do quadro: selo da etapa, contagem e os cartões das ordens. Etapa vazia fica estreita e a de canceladas
 * começa recolhida (o histórico não disputa espaço com o que está em andamento), para as demais crescerem.
 *
 * @param props - Etapa, ordens dela e callback das ações.
 * @returns Região nomeada com a lista de ordens da etapa.
 */
export function OrderBoardColumn({ column, orders, onAction }: OrderBoardColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isCollapsible = column.status === 'cancelada' && orders.length > 0
  const isCollapsed = isCollapsible && !isExpanded
  const isNarrow = orders.length === 0 || isCollapsed
  const contentId = `ordens-${column.status}`
  const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown

  const header = (
    <>
      <StatusBadge kind="ordem" status={column.badge} />
      <span className="text-muted-foreground flex items-center gap-1 text-sm font-semibold tabular-nums">
        {orders.length}
        {isCollapsible ? <ChevronIcon aria-hidden="true" /> : null}
      </span>
    </>
  )

  return (
    <section
      aria-label={`${column.label} (${orders.length})`}
      className={cn('bg-muted/40 flex flex-col gap-2.5 rounded-lg p-3', isNarrow ? 'lg:w-44 lg:flex-none' : 'lg:min-w-0 lg:flex-1')}
    >
      {isCollapsible ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={`${column.label} (${orders.length}): ${isExpanded ? 'recolher' : 'expandir'}`}
          onClick={() => setIsExpanded((wasExpanded) => !wasExpanded)}
        >
          <span className="flex w-full items-center justify-between">{header}</span>
        </Button>
      ) : (
        <header className="flex items-center justify-between">{header}</header>
      )}
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-xs">Nenhuma ordem nesta etapa.</p>
      ) : null}
      {orders.length > 0 && !isCollapsed ? (
        <ul id={contentId} className="flex flex-col gap-2.5">
          {orders.map((order) => (
            <OrderCard key={order.id_inspecao} order={order} onAction={onAction} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}
