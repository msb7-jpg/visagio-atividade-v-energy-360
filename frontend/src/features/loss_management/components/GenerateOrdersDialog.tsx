import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { SelectionOutlookNote } from '@/features/loss_management/components/SelectionOutlookNote'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { useCreateInspectionsBatchMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { QueueSummary, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { describeReasons, formatInteger, ordersLabel } from '@/features/loss_management/utils/lossFormatters'

const ignoreClose = () => undefined

function pickCloseHandler(isPending: boolean, hasFailures: boolean, onClose: () => void, onDone: () => void) {
  if (isPending) return ignoreClose
  return hasFailures ? onDone : onClose
}

interface GenerateOrdersDialogProps {
  units: SuspiciousUnit[]
  summary: QueueSummary | undefined
  onClose: () => void
  /** Chamado quando o lote termina sem falhas, ou quando o gerente fecha o resultado com falhas. */
  onDone: () => void
}

/**
 * Confirmação da geração em lote: resumo da seleção e, depois, as UCs que não puderam receber ordem.
 *
 * @param props - UCs marcadas, resumo da seleção e callbacks.
 * @returns Diálogo que gera uma ordem por UC e mantém aberto o resultado quando alguma falha.
 */
export function GenerateOrdersDialog({ units: selectedUnits, summary: currentSummary, onClose, onDone }: GenerateOrdersDialogProps) {
  const batchMutation = useCreateInspectionsBatchMutation()
  // Congela a seleção ao abrir: depois do lote a fila é recarregada e as UCs geradas deixam de ser selecionáveis.
  const [units] = useState(selectedUnits)
  const [summary] = useState(currentSummary)
  const count = units.length
  const failures = batchMutation.data?.failed ?? []
  const createdCount = batchMutation.data?.created.length ?? 0

  const handleConfirm = () => {
    const payloads = units.map((unit) => ({ id_uc: unit.id_uc, motivo: describeReasons(unit.motivos) }))
    batchMutation.mutate(payloads, {
      onSuccess: (result) => {
        if (result.failed.length > 0) return
        const generatedCount = result.created.length
        toast.success(`${generatedCount} ${ordersLabel(generatedCount)} ${generatedCount === 1 ? 'gerada' : 'geradas'}.`)
        onDone()
      }
    })
  }

  // Com o lote em andamento o diálogo não fecha: fechar esconderia as falhas e deixaria a seleção desatualizada.
  const closeHandler = pickCloseHandler(batchMutation.isPending, failures.length > 0, onClose, onDone)

  return (
    <ActionDialog
      title={`Gerar ${count} ${ordersLabel(count)} de inspeção`}
      description="As UCs passam de Na fila para Ordem gerada e aparecem na aba Ordens de inspeção."
      onClose={closeHandler}
    >
      {summary ? (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Energia recuperável</dt>
          <dd>{formatInteger(summary.kwh_mes_selecionadas)} kWh/mês</dd>
          <dt className="text-muted-foreground">Retorno esperado</dt>
          <dd>{formatInteger(summary.retorno_esperado_kwh_mes)} kWh/mês</dd>
          <dt className="text-muted-foreground">Capacidade depois</dt>
          <dd>{summary.capacidade_programada + count} de {summary.capacidade_total}</dd>
        </dl>
      ) : null}
      <SelectionOutlookNote units={units} />
      {failures.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div role="alert" className="text-destructive flex flex-col gap-1 text-sm">
            <p>{createdCount} de {count} {ordersLabel(count)} geradas. Não foi possível gerar para:</p>
            <ul className="list-disc pl-5">
              {failures.map((failure) => (
                <li key={failure.id_uc}>{failure.id_uc}: {failure.message}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" onClick={onDone}>Fechar</Button>
          </DialogFooter>
        </div>
      ) : (
        <ActionDialogFooter
          confirmLabel={`Confirmar e gerar ${count} ${ordersLabel(count)}`}
          isPending={batchMutation.isPending}
          isCancelDisabled={batchMutation.isPending}
          errorMessage={batchMutation.isError ? 'Não foi possível gerar as ordens. Tente novamente.' : null}
          onCancel={onClose}
          onConfirm={handleConfirm}
        />
      )}
    </ActionDialog>
  )
}
