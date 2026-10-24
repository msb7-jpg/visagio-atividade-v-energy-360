import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { useCreateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'
import { describeReasons, formatKwh } from '@/features/loss_management/utils/lossFormatters'

interface CreateInspectionDialogProps {
  unit: SuspiciousUnit
  onClose: () => void
}

/**
 * Confirmação de abertura de ordem de inspeção para uma UC da fila.
 *
 * @param props - UC selecionada e callback de fechamento.
 * @returns Diálogo de confirmação com resumo da suspeita.
 */
export function CreateInspectionDialog({ unit, onClose }: CreateInspectionDialogProps) {
  const createMutation = useCreateInspectionMutation()
  const motivo = describeReasons(unit.motivos)

  const handleConfirm = () => {
    createMutation.mutate(
      { id_uc: unit.id_uc, motivo },
      { onSuccess: onClose }
    )
  }

  return (
    <ActionDialog title="Gerar ordem de inspeção" description="A UC sai da fila e passa para a aba Ordens em Campo." onClose={onClose}>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">UC</dt>
        <dd className="font-mono">{unit.id_uc}</dd>
        <dt className="text-muted-foreground">Motivo</dt>
        <dd>{motivo}</dd>
        <dt className="text-muted-foreground">Energia a recuperar</dt>
        <dd>{formatKwh(unit.kwh_estimado_recuperar)}</dd>
      </dl>
      <ActionDialogFooter
        confirmLabel="Confirmar ordem"
        isPending={createMutation.isPending}
        errorMessage={createMutation.isError ? getApiErrorMessage(createMutation.error) : null}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
    </ActionDialog>
  )
}
