import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

interface PickFieldOrderDialogProps {
  fieldOrders: InspectionOrder[]
  onPick: (order: InspectionOrder) => void
  onClose: () => void
}

/**
 * Primeiro passo do atalho "Registrar achado": escolhe qual ordem em campo recebe o resultado.
 *
 * @param props - Ordens em campo, callback com a ordem escolhida e fechamento.
 * @returns Diálogo com o seletor de ordem; sem ordem em campo, explica o que falta.
 */
export function PickFieldOrderDialog({ fieldOrders, onPick, onClose }: PickFieldOrderDialogProps) {
  const [selectedId, setSelectedId] = useState('')
  const hasOrders = fieldOrders.length > 0
  const confirm = () => {
    const chosenOrder = fieldOrders.find((order) => String(order.id_inspecao) === selectedId)
    if (chosenOrder) onPick(chosenOrder)
  }

  return (
    <ActionDialog
      title="Registrar achado de campo"
      description={hasOrders ? 'Escolha a ordem em campo que recebe o resultado.' : 'Não há ordem em campo. Envie uma ordem pendente a campo para registrar o achado.'}
      onClose={onClose}
    >
      {hasOrders ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ordem-em-campo" required>Ordem em campo</Label>
          <Select id="ordem-em-campo" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Selecione</option>
            {fieldOrders.map((order) => (
              <option key={order.id_inspecao} value={order.id_inspecao}>{`${formatOrderCode(order)} · UC ${order.id_uc}`}</option>
            ))}
          </Select>
        </div>
      ) : null}
      <ActionDialogFooter
        confirmLabel="Continuar"
        isPending={false}
        isConfirmDisabled={selectedId === ''}
        errorMessage={null}
        onCancel={onClose}
        onConfirm={confirm}
      />
    </ActionDialog>
  )
}
