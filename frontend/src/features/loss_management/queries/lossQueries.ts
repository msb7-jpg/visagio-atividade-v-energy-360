import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

export const lossKeys = {
  all: ['losses'] as const,
  suspiciousUnits: (filters: SuspiciousUnitsFilter) => [...lossKeys.all, 'suspicious-units', filters] as const,
  inspections: () => [...lossKeys.all, 'inspections'] as const
}

// Fila e ordens mudam a cada ação do gerente: cache curto para refletir o trabalho de campo.
const LOSS_STALE_TIME_MS = 30 * 1000

/**
 * Remove filtros vazios: evita query params em branco e chaves de cache distintas para a mesma fila.
 *
 * @param filters - Filtros digitados na tela.
 * @returns Apenas os filtros preenchidos.
 */
function compactFilters(filters: SuspiciousUnitsFilter): SuspiciousUnitsFilter {
  const filledEntries = Object.entries(filters).filter(([, filterValue]) => Boolean(filterValue?.trim()))
  return Object.fromEntries(filledEntries)
}

/**
 * Opções reutilizáveis da consulta da fila de suspeitas.
 *
 * @param filters - Filtros de município, bairro e classe.
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
