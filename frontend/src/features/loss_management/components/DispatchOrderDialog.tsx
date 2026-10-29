import { useState } from 'react'
import { toast } from 'sonner'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { InspectorField } from '@/features/loss_management/components/InspectorField'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { describeSubmitError } from '@/features/loss_management/utils/apiFieldErrors'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

interface DispatchOrderDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Envia uma ordem gerada para campo (status pendente), com o inspetor escolhido na lista (opcional).
 *
 * @param props - Ordem gerada e callback de fechamento.
 * @returns Diálogo de envio para campo.
 */
export function DispatchOrderDialog({ order, onClose }: DispatchOrderDialogProps) {
  const updateMutation = useUpdateInspectionMutation()
  const [inspector, setInspector] = useState(order.inspetor ?? '')
  const { fields: fieldErrors, message: footerError } = describeSubmitError(updateMutation.error)

  const handleInspectorChange = (inspectorCode: string) => {
    setInspector(inspectorCode)
    if (updateMutation.isError) updateMutation.reset()
  }

  const handleConfirm = () => {
    const payload = inspector ? { status: 'pendente' as const, inspetor: inspector } : { status: 'pendente' as const }
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload }, {
      onSuccess: () => {
        const withInspector = inspector ? ` com ${inspector}` : ''
        toast.success(`${formatOrderCode(order)} enviada a campo${withInspector}.`)
        onClose()
      }
    })
  }

  return (
    <ActionDialog title={`Enviar ordem ${formatOrderCode(order)} para campo`} description={`UC ${order.id_uc} · a ordem passa ao status Em campo.`} onClose={onClose}>
      <InspectorField id="inspetor-envio" value={inspector} onChange={handleInspectorChange} error={fieldErrors.inspetor} />
      <ActionDialogFooter
        confirmLabel="Confirmar envio"
        isPending={updateMutation.isPending}
        errorMessage={footerError}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
    </ActionDialog>
  )
}
