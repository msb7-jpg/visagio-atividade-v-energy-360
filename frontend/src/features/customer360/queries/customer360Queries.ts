import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { customer360Api } from '@/features/customer360/api/customer360Api'
import { compactTerm, isSearchable } from '@/features/customer360/utils/searchTerms'

type CustomerResource = 'summary' | 'history' | 'events'

const customer360Keys = {
  all: ['customer360'] as const,
  unit: (idUc: string) => [...customer360Keys.all, idUc] as const,
  resource: (idUc: string, resource: CustomerResource) => [...customer360Keys.unit(idUc), resource] as const,
  search: (term: string) => [...customer360Keys.all, 'search', term] as const
}

const CUSTOMER_STALE_TIME_MS = 5 * 60 * 1000
const MAX_RETRIES = 1
const SEARCH_STALE_TIME_MS = 60 * 1000

/**
 * Indica se o erro da API é "UC não encontrada" (404).
 *
 * @param error - Erro lançado pela consulta.
 * @returns Verdadeiro quando o backend respondeu 404.
 */
export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  return !isNotFoundError(error) && failureCount < MAX_RETRIES
}

function customerQueryOptions<TData>(
  idUc: string,
  resource: CustomerResource,
  fetcher: (idUc: string, signal: AbortSignal) => Promise<TData>
) {
  return queryOptions({
    queryKey: customer360Keys.resource(idUc, resource),
    queryFn: ({ signal }) => fetcher(idUc, signal),
    enabled: idUc.length > 0,
    staleTime: CUSTOMER_STALE_TIME_MS,
    retry: shouldRetry
  })
}

/**
 * Opções da consulta do cadastro da UC.
 *
 * @param idUc - Número da UC buscada (vazio desativa a consulta).
 * @returns Opções de query com cancelamento via signal.
 */
export function customerSummaryQueryOptions(idUc: string) {
  return customerQueryOptions(idUc, 'summary', customer360Api.getSummary)
}

/**
 * Opções da consulta do histórico de consumo, faturas e diagnóstico de conta alta.
 *
 * @param idUc - Número da UC buscada (vazio desativa a consulta).
 * @returns Opções de query com cancelamento via signal.
 */
export function customerHistoryQueryOptions(idUc: string) {
  return customerQueryOptions(idUc, 'history', customer360Api.getHistory)
}

/**
 * Opções da consulta de interrupções do alimentador e chamados da UC.
 *
 * @param idUc - Número da UC buscada (vazio desativa a consulta).
 * @returns Opções de query com cancelamento via signal.
 */
export function customerEventsQueryOptions(idUc: string) {
  return customerQueryOptions(idUc, 'events', customer360Api.getEvents)
}

/**
 * Opções da consulta de sugestões enquanto o atendente digita (número da UC ou do medidor).
 *
 * @param typedText - Texto digitado, já com debounce.
 * @returns Opções de query que mantêm as sugestões anteriores enquanto as novas chegam.
 */
export function customerSearchQueryOptions(typedText: string) {
  const term = compactTerm(typedText)
  return queryOptions({
    queryKey: customer360Keys.search(term),
    queryFn: ({ signal }) => customer360Api.search(term, signal),
    enabled: isSearchable(term),
    staleTime: SEARCH_STALE_TIME_MS,
    placeholderData: keepPreviousData
  })
}
