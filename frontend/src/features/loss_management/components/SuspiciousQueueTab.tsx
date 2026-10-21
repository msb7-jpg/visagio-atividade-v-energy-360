import { useState } from 'react'
import { AsyncListState } from '@/features/loss_management/components/AsyncListState'
import { CreateInspectionDialog } from '@/features/loss_management/components/CreateInspectionDialog'
import { QueueFiltersForm } from '@/features/loss_management/components/QueueFiltersForm'
import { SuspiciousUnitsTable } from '@/features/loss_management/components/SuspiciousUnitsTable'
import { useSuspiciousUnitsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { SuspiciousUnit, SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

/**
 * Aba da fila de suspeitas: filtros, ranking e geração de ordem.
 *
 * @returns Conteúdo da aba "Fila de Suspeitas".
 */
export function SuspiciousQueueTab() {
  const [filters, setFilters] = useState<SuspiciousUnitsFilter>({})
  const [selectedUnit, setSelectedUnit] = useState<SuspiciousUnit | null>(null)
  const { data: units = [], isLoading, isError } = useSuspiciousUnitsQuery(filters)

  return (
    <div className="flex flex-col gap-4">
      <QueueFiltersForm onApply={setFilters} />
      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={units.length === 0}
        errorTitle="Não foi possível carregar a fila"
        emptyTitle="Nenhuma UC suspeita na fila"
        emptyDescription="Nenhuma UC atende aos critérios. UCs com geração distribuída, com ordem ativa ou já inspecionadas na janela de análise ficam fora da fila."
      >
        <SuspiciousUnitsTable units={units} onGenerateOrder={setSelectedUnit} />
      </AsyncListState>
      {selectedUnit ? <CreateInspectionDialog unit={selectedUnit} onClose={() => setSelectedUnit(null)} /> : null}
    </div>
  )
}
