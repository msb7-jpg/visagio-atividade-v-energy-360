import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  excludedUnitsQueryOptions,
  inspectionsQueryOptions,
  inspectorsQueryOptions,
  orderEventsQueryOptions,
  queueFiltersQueryOptions,
  queueSummaryQueryOptions,
  suspiciousUnitsQueryOptions,
  unitDetailQueryOptions
} from '@/features/loss_management/queries/lossQueries'
import type { ExcludedUnitsFilter } from '@/features/loss_management/types/excludedTypes'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

/**
 * Fila de UCs suspeitas priorizada pelo backend.
 *
 * @param filters - Filtros aplicados à fila.
* @returns Estado da query da fila, em páginas do servidor (`fetchNextPage` traz as UCs seguintes).
 */
export function useSuspiciousUnitsQuery(filters: SuspiciousUnitsFilter) {
  return useInfiniteQuery(suspiciousUnitsQueryOptions(filters))
}

/**
 * Detalhe de uma UC da fila (conta do score, consumo de 12 meses e inspeções anteriores), em cache por UC.
 *
 * @param idUc - UC aberta no painel; nulo mantém a consulta desligada.
 * @param fullHistory - Consumo desde a primeira leitura da UC, em vez dos 12 últimos meses.
 * @returns Estado da query do detalhe; ao trocar o período da mesma UC, mantém o detalhe anterior na tela.
 */
export function useUnitDetailQuery(idUc: string | null, fullHistory: boolean) {
  return useQuery({
    ...unitDetailQueryOptions(idUc ?? '', fullHistory),
    enabled: idUc !== null,
    placeholderData: (previousData) => (idUc !== null && previousData?.id_uc === idUc ? previousData : undefined)
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

/**
 * UCs com queda de consumo que ficaram fora da fila, com motivo e data de reavaliação.
 *
 * @param filters - Motivo de exclusão opcional.
 * @returns Estado da query paginada (`fetchNextPage` traz as UCs seguintes).
 */
export function useExcludedUnitsQuery(filters: ExcludedUnitsFilter) {
  return useInfiniteQuery(excludedUnitsQueryOptions(filters))
}

/**
 * Trilha de auditoria de uma ordem: quem mudou o quê e quando.
 *
 * @param idInspecao - Ordem aberta no histórico.
 * @returns Estado da query dos eventos, do primeiro ao mais recente.
 */
export function useOrderEventsQuery(idInspecao: number) {
  return useQuery(orderEventsQueryOptions(idInspecao))
}
