import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import type { SuspiciousQueue, SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

export const lossKeys = {
  all: ['losses'] as const,
  suspiciousUnits: (filters: SuspiciousUnitsFilter) => [...lossKeys.all, 'suspicious-units', filters] as const,
  unitDetail: (idUc: string) => [...lossKeys.all, 'unit-detail', idUc] as const,
  inspections: () => [...lossKeys.all, 'inspections'] as const,
  queueSummary: (selectedIds: string[]) => [...lossKeys.all, 'queue-summary', selectedIds] as const,
  queueFilters: () => [...lossKeys.all, 'queue-filters'] as const,
  inspectors: () => [...lossKeys.all, 'inspectors'] as const
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
  const filledEntries = Object.entries(filters).filter(([, filterValue]) => Boolean(filterValue?.trim()))
  return Object.fromEntries(filledEntries)
}

/**
 * Próximo `offset` da fila: quantas UCs já vieram, ou nada quando a fila inteira está carregada.
 *
 * @param pages - Páginas já carregadas, da primeira à última.
 * @returns O `offset` da próxima página, ou undefined quando não há mais UCs.
 */
function nextQueueOffset(pages: SuspiciousQueue[]): number | undefined {
  const lastPage = pages[pages.length - 1]
  const loadedCount = pages.reduce((count, page) => count + page.itens.length, 0)
  return lastPage.itens.length > 0 && loadedCount < lastPage.total ? loadedCount : undefined
}

/**
 * Opções reutilizáveis da consulta da fila de suspeitas, paginada pelo servidor (`offset`).
 *
 * @param filters - Filtros de município, bairro, classe e motivo.
 * @returns Opções de query infinita com chave hierárquica e cancelamento via signal.
 */
export function suspiciousUnitsQueryOptions(filters: SuspiciousUnitsFilter) {
  const activeFilters = compactFilters(filters)
  return infiniteQueryOptions({
    queryKey: lossKeys.suspiciousUnits(activeFilters),
    // A primeira página não leva `offset`, para a chamada continuar igual à de antes da paginação.
    queryFn: ({ pageParam, signal }) =>
      lossApi.listSuspiciousUnits(pageParam > 0 ? { ...activeFilters, offset: pageParam } : activeFilters, signal),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, allPages) => nextQueueOffset(allPages),
    staleTime: LOSS_STALE_TIME_MS,
    // Mantém fila e avisos na tela enquanto o novo filtro carrega, sem piscar nem reanunciar o banner.
    placeholderData: keepPreviousData
  })
}

/**
 * Opções reutilizáveis do detalhe de uma UC da fila; o cache é por UC, então reabrir a mesma UC não refaz a chamada.
 *
 * @param idUc - UC aberta no painel.
 * @returns Opções de query com chave por UC e cancelamento via signal.
 */
export function unitDetailQueryOptions(idUc: string) {
  return queryOptions({
    queryKey: lossKeys.unitDetail(idUc),
    queryFn: ({ signal }) => lossApi.getUnitDetail(idUc, signal),
    staleTime: LOSS_STALE_TIME_MS
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
 * Opções reutilizáveis da lista de inspetores de campo; o cache é longo porque a lista só muda com a carga do histórico.
 *
 * @returns Opções de query com cancelamento via signal.
 */
export function inspectorsQueryOptions() {
  return queryOptions({
    queryKey: lossKeys.inspectors(),
    queryFn: ({ signal }) => lossApi.listInspectors(signal),
    staleTime: FILTER_OPTIONS_STALE_TIME_MS
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
