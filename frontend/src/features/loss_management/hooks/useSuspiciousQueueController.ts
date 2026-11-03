import { useState } from 'react'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import {
  useQueueFiltersQuery,
  useQueueSummaryQuery,
  useSuspiciousUnitsQuery
} from '@/features/loss_management/hooks/useLossQueries'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'
import { TOP_SELECTION_COUNT, isPriorityUnit } from '@/features/loss_management/utils/queueBands'
import { hasActiveFilters } from '@/features/loss_management/utils/queueFilters'

/**
 * Controlador headless da Fila de Inspeção: filtros, fila, seleção em massa, resumo dos cartões e diálogo de lote.
 *
 * Vive na página (e não na aba) para que filtros e seleção sobrevivam à troca de aba.
 *
 * @returns Estado e ações que os componentes da fila consomem.
 */
export function useSuspiciousQueueController() {
  const [filters, setFilters] = useState<SuspiciousUnitsFilter>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [detailUcId, setDetailUcId] = useState<string | null>(null)
  const queueQuery = useSuspiciousUnitsQuery(filters)
  const pages = queueQuery.data?.pages ?? []
  const units = pages.flatMap((page) => page.itens)
  const selection = useQueueSelection(units)
  const summaryQuery = useQueueSummaryQuery(selection.selectedIds)
  const filterOptionsQuery = useQueueFiltersQuery()

  // Com a fila filtrada em ordem gerada ou em campo não há UC livre para marcar: o Top passa o filtro de situação
  // para "na fila" e marca o topo dessa fila; a seleção aparece quando a lista nova carrega.
  const selectTopUnits = async () => {
    if (filters.situacao === undefined || filters.situacao === 'na_fila') {
      selection.selectTop(TOP_SELECTION_COUNT, isPriorityUnit)
      return
    }
    const freeFilters = { ...filters, situacao: 'na_fila' as const }
    setFilters(freeFilters)
    try {
      const freeQueue = await lossApi.listSuspiciousUnits(freeFilters)
      const topIds = freeQueue.itens.filter(isPriorityUnit).slice(0, TOP_SELECTION_COUNT).map((unit) => unit.id_uc)
      selection.selectIds(topIds)
    } catch {
      // A lista mostra o erro e o botão de tentar de novo; sem a fila não há o que marcar.
    }
  }

  const finishGeneration = () => {
    setIsDialogOpen(false)
    selection.clear()
  }

  // Reaproveita o fluxo em lote: marca só esta UC e abre a mesma confirmação de "Gerar N ordens".
  const generateForUnit = (idUc: string) => {
    selection.selectOnly(idUc)
    setDetailUcId(null)
    setIsDialogOpen(true)
  }

  return {
    detailUcId,
    openDetail: setDetailUcId,
    closeDetail: () => setDetailUcId(null),
    generateForUnit,
    filters,
    setFilters,
    clearFilters: () => setFilters({}),
    hasActiveFilters: hasActiveFilters(filters),
    retryQueue: () => void queueQuery.refetch(),
    retrySummary: () => void summaryQuery.refetch(),
    filterOptions: filterOptionsQuery.data,
    units,
    total: pages.at(-1)?.total,
    warnings: pages[0]?.avisos ?? [],
    hasMoreUnits: queueQuery.hasNextPage,
    isLoadingMoreUnits: queueQuery.isFetchingNextPage,
    loadMoreUnits: () => void queueQuery.fetchNextPage(),
    isLoading: queueQuery.isLoading,
    isError: queueQuery.isError,
    selection,
    selectTopUnits: () => void selectTopUnits(),
    selectedUnits: units.filter((unit) => selection.selectedIds.includes(unit.id_uc)),
    summary: summaryQuery.data,
    isSummaryUpdating: summaryQuery.isPlaceholderData,
    isSummaryError: summaryQuery.isError,
    isDialogOpen,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    finishGeneration
  }
}

export type SuspiciousQueueController = ReturnType<typeof useSuspiciousQueueController>
