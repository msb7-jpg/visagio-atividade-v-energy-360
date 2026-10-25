import { AsyncState } from '@/components/feedback/AsyncState'
import { Card } from '@/components/ui/card'
import { GenerateOrdersDialog } from '@/features/loss_management/components/GenerateOrdersDialog'
import { PrioritizedQueueTable } from '@/features/loss_management/components/PrioritizedQueueTable'
import { QueueActionsBar, TOP_SELECTION_COUNT } from '@/features/loss_management/components/QueueActionsBar'
import { QueueFilters } from '@/features/loss_management/components/QueueFilters'
import { QueueSummaryCards } from '@/features/loss_management/components/QueueSummaryCards'
import { QueueWarnings } from '@/features/loss_management/components/QueueWarnings'
import type { SuspiciousQueueController } from '@/features/loss_management/hooks/useSuspiciousQueueController'

interface SuspiciousQueueTabProps {
  queue: SuspiciousQueueController
}

/**
 * Aba da fila priorizada: cartões do topo, filtros, ações em massa, ranking e geração de ordens.
 *
 * @param props - Controlador da fila, mantido na página para sobreviver à troca de aba.
 * @returns Conteúdo da aba "Fila priorizada".
 */
export function SuspiciousQueueTab({ queue }: SuspiciousQueueTabProps) {
  const { units, selection, summary } = queue

  return (
    <div className="flex flex-col gap-4">
      <QueueSummaryCards summary={summary} isUpdating={queue.isSummaryUpdating} isError={queue.isSummaryError} />
      <Card className="flex flex-col gap-3 p-4">
        <QueueFilters filters={queue.filters} options={queue.filterOptions} onChange={queue.setFilters} />
        <QueueActionsBar
          selectedCount={selection.selectedIds.length}
          hasOrdersToExport={(summary?.capacidade_programada ?? 0) > 0}
          onSelectTop={() => selection.selectTop(TOP_SELECTION_COUNT)}
          onGenerate={queue.openDialog}
        />
      </Card>
      <QueueWarnings warnings={queue.warnings} />
      <AsyncState
        isLoading={queue.isLoading}
        isError={queue.isError}
        isEmpty={units.length === 0}
        errorTitle="Não foi possível carregar a fila"
        errorDescription="Verifique a conexão com a API e se as tabelas Gold de cadastro e medição estão disponíveis."
        emptyTitle="Nenhuma UC suspeita na fila"
        emptyDescription="Nenhuma UC atende aos critérios. UCs com geração distribuída ou já inspecionadas na janela de análise ficam fora da fila."
      >
        <PrioritizedQueueTable
          key={JSON.stringify(queue.filters)}
          units={units}
          total={queue.total ?? units.length}
          selection={selection}
        />
      </AsyncState>
      {queue.isDialogOpen ? (
        <GenerateOrdersDialog
          units={queue.selectedUnits}
          summary={summary}
          onClose={queue.closeDialog}
          onDone={queue.finishGeneration}
        />
      ) : null}
    </div>
  )
}
