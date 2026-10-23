import { useQuery } from '@tanstack/react-query'
import { inspectionsQueryOptions, suspiciousUnitsQueryOptions } from '@/features/loss_management/queries/lossQueries'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

/**
 * Fila de UCs suspeitas priorizada pelo backend.
 *
 * @param filters - Filtros aplicados à fila.
 * @returns Estado da query da fila.
 */
export function useSuspiciousUnitsQuery(filters: SuspiciousUnitsFilter) {
  return useQuery(suspiciousUnitsQueryOptions(filters))
}

/**
 * Ordens de inspeção da mais recente para a mais antiga.
 *
 * @returns Estado da query de ordens.
 */
export function useInspectionsQuery() {
  return useQuery(inspectionsQueryOptions())
}
