import { useState } from 'react'
import { AsyncListState } from '@/features/loss_management/components/AsyncListState'
import { CancelOrderDialog } from '@/features/loss_management/components/CancelOrderDialog'
import { DispatchOrderDialog } from '@/features/loss_management/components/DispatchOrderDialog'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { InspectionOrdersTable, type OrderActionKind } from '@/features/loss_management/components/InspectionOrdersTable'
import { RegisterResultDialog } from '@/features/loss_management/components/RegisterResultDialog'
import { useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

interface PendingAction {
  kind: OrderActionKind
  order: InspectionOrder
}

/**
 * Aba de ordens em campo: acompanhamento, resultado de campo e cancelamento.
 *
 * @returns Conteúdo da aba "Ordens em Campo".
 */
export function InspectionOrdersTab() {
  const { data: orders = [], isLoading, isError } = useInspectionsQuery()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const hasOrdersToDispatch = orders.some((order) => order.status === 'gerada' || order.status === 'pendente')
  const closeAction = () => setPendingAction(null)
  const actionKind = pendingAction?.kind

  return (
    <div className="flex flex-col gap-4">
      <ExportOrdersButton disabled={!hasOrdersToDispatch} />
      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={orders.length === 0}
        errorTitle="Não foi possível carregar as ordens"
        errorDescription="Verifique a conexão com a API e tente novamente."
        emptyTitle="Nenhuma ordem de inspeção"
        emptyDescription="Gere ordens a partir da Fila de Suspeitas para acompanhá-las aqui."
      >
        <InspectionOrdersTable orders={orders} onAction={(kind, order) => setPendingAction({ kind, order })} />
      </AsyncListState>
      {pendingAction && actionKind === 'dispatch' ? <DispatchOrderDialog order={pendingAction.order} onClose={closeAction} /> : null}
      {pendingAction && actionKind === 'result' ? <RegisterResultDialog order={pendingAction.order} onClose={closeAction} /> : null}
      {pendingAction && actionKind === 'cancel' ? <CancelOrderDialog order={pendingAction.order} onClose={closeAction} /> : null}
    </div>
  )
}
