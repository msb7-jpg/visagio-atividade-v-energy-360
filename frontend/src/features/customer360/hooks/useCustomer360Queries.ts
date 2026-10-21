import { useQuery } from '@tanstack/react-query'
import {
  customerEventsQueryOptions,
  customerHistoryQueryOptions,
  customerSummaryQueryOptions
} from '@/features/customer360/queries/customer360Queries'

/**
 * Cadastro da UC buscada.
 *
 * @param idUc - Número da UC (vazio não consulta).
 * @returns Estado da query do cadastro.
 */
export function useCustomerSummaryQuery(idUc: string) {
  return useQuery(customerSummaryQueryOptions(idUc))
}

/**
 * Consumo YoY, faturas e diagnóstico de conta alta da UC buscada.
 *
 * @param idUc - Número da UC (vazio não consulta).
 * @returns Estado da query do histórico.
 */
export function useCustomerHistoryQuery(idUc: string) {
  return useQuery(customerHistoryQueryOptions(idUc))
}

/**
 * Interrupções do alimentador e chamados da UC buscada.
 *
 * @param idUc - Número da UC (vazio não consulta).
 * @returns Estado da query de eventos.
 */
export function useCustomerEventsQuery(idUc: string) {
  return useQuery(customerEventsQueryOptions(idUc))
}
