import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

export const lossKeys = {
  all: ['losses'] as const,
  suspiciousUnits: (filters: SuspiciousUnitsFilter) => [...lossKeys.all, 'suspicious-units', filters] as const,
  inspections: () => [...lossKeys.all, 'inspections'] as const,
  queueSummary: (selectedIds: string[]) => [...lossKeys.all, 'queue-summary', selectedIds] as const,
  queueFilters: () => [...lossKeys.all, 'queue-filters'] as const
}

// Fila e ordens mudam a cada ação do gerente: cache curto para refletir o trabalho de campo.
const LOSS_STALE_TIME_MS = 30 * 1000
// Municípios e classes só mudam com a carga do cadastro.
const FILTER_OPTIONS_STALE_TIME_MS = 10 * 60 * 1000

/**
 * Remove filtros vazios: evita query params em branco e chaves de cache distintas para a mesma fila.
 *
 * @param filters - Filtros digitados na tela.
 * @returns Apenas os filtros preenchidos.
 */
function compactFilters(filters: SuspiciousUnitsFilter): SuspiciousUnitsFilter {
  const filledEntries = Object.entries(filters).filter(([, filterValue]) =>
    typeof filterValue === 'number' ? filterValue > 0 : Boolean(filterValue?.trim())
  )
  return Object.fromEntries(filledEntries)
}

/**
 * Opções reutilizáveis da consulta da fila de suspeitas.
 *
 * @param filters - Filtros de município, bairro, classe, motivo e score mínimo.
 * @returns Opções de query com chave hierárquica e cancelamento via signal.
 */
export function suspiciousUnitsQueryOptions(filters: SuspiciousUnitsFilter) {
  const activeFilters = compactFilters(filters)
  return queryOptions({
    queryKey: lossKeys.suspiciousUnits(activeFilters),
    queryFn: ({ signal }) => lossApi.listSuspiciousUnits(activeFilters, signal),
    staleTime: LOSS_STALE_TIME_MS,
    // Mantém fila e avisos na tela enquanto o novo filtro carrega, sem piscar nem reanunciar o banner.
    placeholderData: keepPreviousData
  })
}

/**
 * Opções reutilizáveis da consulta de ordens de inspeção.
 *
 * @returns Opções de query com chave hierárquica e cancelamento via signal.
 */
export function inspectionsQueryOptions() {
  return queryOptions({
    queryKey: lossKeys.inspections(),
    queryFn: ({ signal }) => lossApi.listInspections(undefined, signal),
    staleTime: LOSS_STALE_TIME_MS
  })
}

/**
 * Opções reutilizáveis do resumo dos cartões do topo para a seleção atual.
 *
 * @param selectedIds - UCs marcadas na tela (a ordem da seleção não muda a chave de cache).
 * @returns Opções de query que mantêm o resumo anterior na tela enquanto o novo carrega.
 */
export function queueSummaryQueryOptions(selectedIds: string[]) {
  const sortedIds = [...selectedIds].sort((firstId, secondId) => firstId.localeCompare(secondId))
  return queryOptions({
    queryKey: lossKeys.queueSummary(sortedIds),
    queryFn: ({ signal }) => lossApi.getQueueSummary(sortedIds, signal),
    staleTime: LOSS_STALE_TIME_MS,
    placeholderData: keepPreviousData
  })
}

/**
 * Opções reutilizáveis das opções dos filtros de município e classe.
 *
 * @returns Opções de query com cache longo.
 */
export function queueFiltersQueryOptions() {
  return queryOptions({
    queryKey: lossKeys.queueFilters(),
    queryFn: ({ signal }) => lossApi.getQueueFilters(signal),
    staleTime: FILTER_OPTIONS_STALE_TIME_MS
  })
}
