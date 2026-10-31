import { useState } from 'react'
import { toast } from 'sonner'
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
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/features/loss_management/components/FieldError'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { CancellationReason, InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { describeSubmitError } from '@/features/loss_management/utils/apiFieldErrors'
import {
  CANCELLATION_REASONS,
  CANCELLATION_REASON_LABELS,
  describeQueueEffect
} from '@/features/loss_management/utils/cancellationReasons'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

const MAX_NOTE_LENGTH = 500

interface CancelOrderDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Cancelamento irreversível de ordem ativa, com motivo obrigatório (lista fechada) e observação opcional.
 * Erros do servidor aparecem aqui dentro, ao lado do campo quando possível; o diálogo só fecha com sucesso.
 *
 * @param props - Ordem ativa e callback de fechamento.
 * @returns Diálogo de alerta de cancelamento.
 */
export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const updateMutation = useUpdateInspectionMutation()
  const [reason, setReason] = useState<CancellationReason | ''>('')
  const [note, setNote] = useState('')
  const { fields: fieldErrors, message: footerError } = describeSubmitError(updateMutation.error)
  const trimmedNote = note.trim()

  const handleConfirm = () => {
    if (reason === '') return
    const payload = {
      status: 'cancelada' as const,
      motivo_cancelamento: reason,
      ...(trimmedNote ? { justificativa_cancelamento: trimmedNote } : {})
    }
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload }, {
      onSuccess: () => {
        toast.success(`${formatOrderCode(order)} cancelada.`)
        onClose()
      }
    })
  }

  return (
    <AlertDialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar a ordem {formatOrderCode(order)}?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente cancelar esta inspeção? O motivo escolhido define o que acontece com a UC {order.id_uc} na fila.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivo-cancelamento" required>Motivo do cancelamento</Label>
          <Select
            id="motivo-cancelamento"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value as CancellationReason | '')
              if (updateMutation.isError) updateMutation.reset()
            }}
            error={Boolean(fieldErrors.motivo_cancelamento)}
            aria-invalid={Boolean(fieldErrors.motivo_cancelamento)}
            aria-describedby="motivo-cancelamento-erro"
          >
            <option value="">Selecione o motivo</option>
            {CANCELLATION_REASONS.map((reasonCode) => (
              <option key={reasonCode} value={reasonCode}>{CANCELLATION_REASON_LABELS[reasonCode]}</option>
            ))}
          </Select>
          <FieldError id="motivo-cancelamento-erro" message={fieldErrors.motivo_cancelamento} />
          {reason === '' ? null : <p className="text-muted-foreground text-sm">{describeQueueEffect(reason, order.id_uc)}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="observacao-cancelamento">Observação (opcional)</Label>
          <Textarea
            id="observacao-cancelamento"
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            aria-invalid={Boolean(fieldErrors.justificativa_cancelamento)}
            aria-describedby="observacao-cancelamento-erro"
          />
          <FieldError id="observacao-cancelamento-erro" message={fieldErrors.justificativa_cancelamento} />
        </div>
        {footerError ? <p className="text-destructive text-sm" role="alert">{footerError}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Manter ordem</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason === '' || updateMutation.isPending}
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
