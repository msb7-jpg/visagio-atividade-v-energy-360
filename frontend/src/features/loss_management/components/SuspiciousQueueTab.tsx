import { AsyncState } from '@/components/feedback/AsyncState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GenerateOrdersDialog } from '@/features/loss_management/components/GenerateOrdersDialog'
import { QueueActionsBar, TOP_SELECTION_COUNT } from '@/features/loss_management/components/QueueActionsBar'
import { QueueCapacityNotice } from '@/features/loss_management/components/QueueCapacityNotice'
import { QueueBandTabs } from '@/features/loss_management/components/QueueBandTabs'
import { QueueFilters } from '@/features/loss_management/components/QueueFilters'
import { SelectionOutlookNote } from '@/features/loss_management/components/SelectionOutlookNote'
import { QueueSummaryCards } from '@/features/loss_management/components/QueueSummaryCards'
import { QueueWarnings } from '@/features/loss_management/components/QueueWarnings'
import { UnitDetailSheet } from '@/features/loss_management/components/UnitDetailSheet'
import type { SuspiciousQueueController } from '@/features/loss_management/hooks/useSuspiciousQueueController'
import { isPriorityUnit } from '@/features/loss_management/utils/queueBands'

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
  const isFilteredEmpty = queue.hasActiveFilters && units.length === 0 && !queue.isLoading && !queue.isError

  return (
    <div className="flex flex-col gap-4">
      <QueueSummaryCards
        summary={summary}
        isUpdating={queue.isSummaryUpdating}
        isError={queue.isSummaryError}
        onRetry={queue.retrySummary}
      />
      <Card className="flex flex-col gap-3 p-4">
        <QueueFilters
          filters={queue.filters}
          options={queue.filterOptions}
          onChange={queue.setFilters}
          onClear={queue.clearFilters}
        />
        <QueueActionsBar
          selectedCount={selection.selectedIds.length}
          onSelectTop={() => selection.selectTop(TOP_SELECTION_COUNT, isPriorityUnit)}
          onGenerate={queue.openDialog}
        />
        <SelectionOutlookNote units={queue.selectedUnits} />
      </Card>
      <QueueWarnings warnings={queue.warnings} />
      {summary ? <QueueCapacityNotice units={units} capacity={summary.capacidade_total} /> : null}
      {isFilteredEmpty ? (
        <EmptyState
          title="Nenhuma UC com esses filtros."
          action={<Button type="button" variant="outline" onClick={queue.clearFilters}>Limpar filtros</Button>}
        />
      ) : (
        <AsyncState
          isLoading={queue.isLoading}
          isError={queue.isError}
          isEmpty={units.length === 0}
          errorTitle="Não foi possível carregar a fila"
          errorDescription="Verifique a conexão com a API e se as tabelas Gold de cadastro e medição estão disponíveis."
          onRetry={queue.retryQueue}
          emptyTitle="Nenhuma UC suspeita na fila"
          emptyDescription="Nenhuma UC atende aos critérios. UCs com geração distribuída ou já inspecionadas na janela de análise ficam fora da fila."
        >
          <QueueBandTabs
            key={JSON.stringify(queue.filters)}
            units={units}
            total={queue.total ?? units.length}
            selection={selection}
            onOpenDetail={queue.openDetail}
            onLoadMore={queue.hasMoreUnits ? queue.loadMoreUnits : undefined}
            isLoadingMore={queue.isLoadingMoreUnits}
          />
        </AsyncState>
      )}
      <UnitDetailSheet idUc={queue.detailUcId} onClose={queue.closeDetail} onGenerateOrder={queue.generateForUnit} />
      {queue.isDialogOpen ? (
        <GenerateOrdersDialog
          units={queue.selectedUnits}
          summary={queue.isSummaryUpdating ? undefined : summary}
          onClose={queue.closeDialog}
          onDone={queue.finishGeneration}
        />
      ) : null}
    </div>
  )
}
