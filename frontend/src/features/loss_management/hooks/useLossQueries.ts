import { useQuery } from '@tanstack/react-query'
import {
  inspectionsQueryOptions,
  inspectorsQueryOptions,
  queueFiltersQueryOptions,
  queueSummaryQueryOptions,
  suspiciousUnitsQueryOptions,
  unitDetailQueryOptions
} from '@/features/loss_management/queries/lossQueries'
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
 * Detalhe de uma UC da fila (conta do score, consumo de 12 meses e inspeções anteriores), em cache por UC.
 *
 * @param idUc - UC aberta no painel; nulo mantém a consulta desligada.
 * @returns Estado da query do detalhe.
 */
export function useUnitDetailQuery(idUc: string | null) {
  return useQuery({
    ...unitDetailQueryOptions(idUc ?? ''),
    enabled: idUc !== null
  })
}

/**
 * Inspetores de campo para os seletores dos diálogos de envio e resultado.
 *
 * @returns Estado da query da lista de inspetores.
 */
export function useInspectorsQuery() {
  return useQuery(inspectorsQueryOptions())
}

/**
 * Ordens de inspeção da mais recente para a mais antiga.
 *
 * @returns Estado da query de ordens.
 */
export function useInspectionsQuery() {
  return useQuery(inspectionsQueryOptions())
}

/**
 * Cartões do topo: capacidade, energia das selecionadas, retorno esperado e taxa histórica.
 *
 * @param selectedIds - UCs marcadas na tela.
 * @returns Estado da query do resumo.
 */
export function useQueueSummaryQuery(selectedIds: string[]) {
  return useQuery(queueSummaryQueryOptions(selectedIds))
}

/**
 * Opções dos filtros de município e classe.
 *
 * @returns Estado da query das opções de filtro.
 */
export function useQueueFiltersQuery() {
  return useQuery(queueFiltersQueryOptions())
}
