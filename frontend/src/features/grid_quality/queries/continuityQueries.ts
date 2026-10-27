import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { continuityApi } from '@/features/grid_quality/api/continuityApi'
import type { ContinuityFilters } from '@/features/grid_quality/types/continuityTypes'

export const continuityKeys = {
  all: ['quality', 'continuity'] as const,
  snapshot: (filters: ContinuityFilters) => [...continuityKeys.all, filters] as const
}

/**
 * Opções da consulta da visão de Continuidade.
 *
 * @param filters - Município e inclusão do mês do evento.
 * @returns Opções de query que mantém a visão anterior enquanto o filtro carrega.
 */
export function continuityQueryOptions(filters: ContinuityFilters) {
  return queryOptions({
    queryKey: continuityKeys.snapshot(filters),
    queryFn: () => continuityApi.getSnapshot(filters),
    placeholderData: keepPreviousData
  })
}
