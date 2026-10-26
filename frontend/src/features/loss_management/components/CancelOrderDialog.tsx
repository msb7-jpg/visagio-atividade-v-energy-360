import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'

interface CancelOrderDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Cancelamento irreversível de ordem ativa, com justificativa obrigatória.
 *
 * @param props - Ordem ativa e callback de fechamento.
 * @returns Diálogo de alerta de cancelamento.
 */
export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const updateMutation = useUpdateInspectionMutation()
  const [justification, setJustification] = useState('')
  const trimmedJustification = justification.trim()

  const handleConfirm = () => {
    updateMutation.mutate(
      { idInspecao: order.id_inspecao, payload: { status: 'cancelada', justificativa_cancelamento: trimmedJustification } },
      { onSuccess: onClose }
    )
  }

  return (
    <AlertDialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar a ordem #{order.id_inspecao}?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente cancelar esta inspeção? A UC {order.id_uc} volta para a fila. Justifique o cancelamento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="justificativa-cancelamento" required>Justificativa</Label>
          <Textarea
            id="justificativa-cancelamento"
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
          />
        </div>
        {updateMutation.isError ? (
          <p className="text-destructive text-sm" role="alert">{getApiErrorMessage(updateMutation.error)}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={!trimmedJustification || updateMutation.isPending}
            aria-busy={updateMutation.isPending}
          >
            {updateMutation.isPending ? <Spinner className="size-4" /> : null}
            Confirmar cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
