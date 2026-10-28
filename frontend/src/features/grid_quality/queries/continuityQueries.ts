import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { continuityApi } from '@/features/grid_quality/api/continuityApi'
import type { ContinuityFilters } from '@/features/grid_quality/types/continuityTypes'

/** Chaves de cache da Continuidade; todas começam por `all` para invalidar em bloco. */
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
    queryFn: ({ signal }) => continuityApi.getSnapshot(filters, signal),
    placeholderData: keepPreviousData
  })
}
