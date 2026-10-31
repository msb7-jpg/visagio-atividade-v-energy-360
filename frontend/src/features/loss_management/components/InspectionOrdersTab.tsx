import { useState } from 'react'
import { CancelOrderDialog } from '@/features/loss_management/components/CancelOrderDialog'
import { DispatchOrderDialog } from '@/features/loss_management/components/DispatchOrderDialog'
import { InspectionUploadModal } from '@/features/loss_management/components/InspectionUploadModal'
import { OrderBoard } from '@/features/loss_management/components/OrderBoard'
import { OrderFlowBar } from '@/features/loss_management/components/OrderFlowBar'
import { PickFieldOrderDialog } from '@/features/loss_management/components/PickFieldOrderDialog'
import { RegisterResultDialog } from '@/features/loss_management/components/RegisterResultDialog'
import { useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import type { OrderActionKind } from '@/features/loss_management/utils/orderBoard'

interface PendingAction {
  kind: OrderActionKind
  order: InspectionOrder
}

/**
 * Aba de ordens: quadro por etapa, com envio a campo, resultado, cancelamento e planilha de campo.
 *
 * @returns Conteúdo da aba "Ordens de inspeção".
 */
export function InspectionOrdersTab() {
  const { data: orders = [], isLoading, isError, refetch } = useInspectionsQuery()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const fieldOrders = orders.filter((order) => order.status === 'pendente')
  const canExport = orders.some((order) => order.status === 'gerada' || order.status === 'pendente')
  const closeAction = () => setPendingAction(null)

  return (
    <div className="flex flex-col gap-4">
      <OrderFlowBar canExport={canExport} onImport={() => setIsUploadOpen(true)} onRegister={() => setIsPickerOpen(true)} />
      <OrderBoard
        orders={orders}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onAction={(kind, order) => setPendingAction({ kind, order })}
      />
      {isPickerOpen ? (
        <PickFieldOrderDialog
          fieldOrders={fieldOrders}
          onClose={() => setIsPickerOpen(false)}
          onPick={(order) => {
            setIsPickerOpen(false)
            setPendingAction({ kind: 'result', order })
          }}
        />
      ) : null}
      {isUploadOpen ? <InspectionUploadModal onClose={() => setIsUploadOpen(false)} /> : null}
      {pendingAction?.kind === 'dispatch' ? <DispatchOrderDialog order={pendingAction.order} onClose={closeAction} /> : null}
      {pendingAction?.kind === 'result' ? <RegisterResultDialog order={pendingAction.order} onClose={closeAction} /> : null}
      {pendingAction?.kind === 'cancel' ? <CancelOrderDialog order={pendingAction.order} onClose={closeAction} /> : null}
    </div>
  )
}
