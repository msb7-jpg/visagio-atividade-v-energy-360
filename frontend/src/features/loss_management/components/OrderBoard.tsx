import { AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { OrderBoardColumn } from '@/features/loss_management/components/OrderBoardColumn'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { BOARD_COLUMNS, groupOrdersByStatus, type OrderActionKind } from '@/features/loss_management/utils/orderBoard'

// Pilha no celular e linha no computador; cada coluna define a própria largura (vazia e canceladas ficam estreitas).
const BOARD_LAYOUT_CLASSES = 'flex flex-col gap-2.5 lg:flex-row lg:items-start'

/**
 * Esqueleto com a mesma grade do quadro (uma coluna por etapa), para o carregamento não deslocar o layout.
 *
 * @returns Quatro painéis com blocos de carregamento no lugar dos cartões.
 */
function OrderBoardSkeleton() {
  return (
    <div className={BOARD_LAYOUT_CLASSES} aria-busy="true" aria-label="Carregando ordens de inspeção">
      {BOARD_COLUMNS.map((column) => (
        <div key={column.status} className="bg-muted/40 rounded-lg p-3 lg:flex-1">
          <LoadingSkeleton count={3} className="h-20" />
        </div>
      ))}
    </div>
  )
}

interface OrderBoardProps {
  orders: InspectionOrder[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Quadro de ordens de inspeção: uma coluna por etapa do ciclo, com estados de carregamento e erro.
 *
 * @param props - Ordens, flags da consulta, retentativa e callback das ações.
 * @returns Skeleton, erro com "Tentar novamente" ou as quatro colunas.
 */
export function OrderBoard({ orders, isLoading, isError, onRetry, onAction }: OrderBoardProps) {
  if (isLoading) {
    return <OrderBoardSkeleton />
  }
  if (isError) {
    return (
      <EmptyState
        title="Não foi possível carregar as ordens"
        description="Verifique a conexão com a API e tente novamente."
        icon={<AlertTriangle className="size-10" />}
        action={<Button type="button" variant="outline" onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }
  const ordersByStatus = groupOrdersByStatus(orders)
  return (
    <section aria-label="Ordens de inspeção" className={BOARD_LAYOUT_CLASSES}>
      {BOARD_COLUMNS.map((column) => (
        <OrderBoardColumn key={column.status} column={column} orders={ordersByStatus[column.status]} onAction={onAction} />
      ))}
    </section>
  )
}
