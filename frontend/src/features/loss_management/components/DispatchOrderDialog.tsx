import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

interface DispatchOrderDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Envia uma ordem gerada para campo (status pendente), com fiscal responsável opcional.
 *
 * @param props - Ordem gerada e callback de fechamento.
 * @returns Diálogo de envio para campo.
 */
export function DispatchOrderDialog({ order, onClose }: DispatchOrderDialogProps) {
  const updateMutation = useUpdateInspectionMutation()
  const [fiscal, setFiscal] = useState(order.fiscal_responsavel ?? '')

  const handleConfirm = () => {
    const fiscalName = fiscal.trim()
    const payload = fiscalName ? { status: 'pendente' as const, fiscal_responsavel: fiscalName } : { status: 'pendente' as const }
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload }, {
      onSuccess: () => {
        const withInspector = fiscalName ? ` com ${fiscalName}` : ''
        toast.success(`${formatOrderCode(order)} enviada a campo${withInspector}.`)
        onClose()
      }
    })
  }

  return (
    <ActionDialog title={`Enviar ordem ${formatOrderCode(order)} para campo`} description={`UC ${order.id_uc} · a ordem passa ao status Em campo.`} onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fiscal-responsavel">Fiscal responsável</Label>
        <Input id="fiscal-responsavel" value={fiscal} onChange={(event) => setFiscal(event.target.value)} />
      </div>
      <ActionDialogFooter
        confirmLabel="Confirmar envio"
        isPending={updateMutation.isPending}
        errorMessage={updateMutation.isError ? getApiErrorMessage(updateMutation.error) : null}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
    </ActionDialog>
  )
}
