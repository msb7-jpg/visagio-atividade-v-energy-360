import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { qualityApi } from '@/features/grid_quality/api/qualityApi'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'

export const qualityKeys = {
  all: ['quality'] as const,
  indicators: () => [...qualityKeys.all, 'indicators'] as const,
  feeders: (status: QualityStatus | undefined) => [...qualityKeys.all, 'feeders', status] as const,
  history: (feederId: string) => [...qualityKeys.all, 'history', feederId] as const,
  customers: (feederId: string) => [...qualityKeys.all, 'customers', feederId] as const
}

// DEC/FEC vêm de uma competência mensal fechada: cache longo evita refetch ao reabrir a gaveta.
const QUALITY_STALE_TIME_MS = 5 * 60 * 1000

/**
 * Opções da consulta dos indicadores consolidados da competência mais recente.
 *
 * @returns Opções de query com cancelamento via signal.
 */
export function indicatorsQueryOptions() {
  return queryOptions({
    queryKey: qualityKeys.indicators(),
    queryFn: ({ signal }) => qualityApi.getIndicators(signal),
    staleTime: QUALITY_STALE_TIME_MS
  })
}

/**
 * Opções da consulta do ranking de alimentadores.
 *
 * @param status - Filtro de situação frente ao limite de referência; sem valor traz todos.
 * @returns Opções de query que mantém o ranking anterior enquanto o filtro carrega.
 */
export function feedersQueryOptions(status: QualityStatus | undefined) {
  return queryOptions({
    queryKey: qualityKeys.feeders(status),
    queryFn: ({ signal }) => qualityApi.listFeeders(status, signal),
    staleTime: QUALITY_STALE_TIME_MS,
    placeholderData: keepPreviousData
  })
}

/**
 * Opções da consulta da série histórica de um alimentador.
 *
 * @param feederId - Alimentador aberto na gaveta; `null` desliga a consulta.
 * @returns Opções de query habilitada apenas com alimentador selecionado.
 */
export function feederHistoryQueryOptions(feederId: string | null) {
  return queryOptions({
    queryKey: qualityKeys.history(feederId ?? ''),
    queryFn: ({ signal }) => qualityApi.getFeederHistory(feederId ?? '', signal),
    enabled: feederId !== null,
    staleTime: QUALITY_STALE_TIME_MS
  })
}

/**
 * Opções da consulta dos clientes mais afetados de um alimentador (padrão da API: 12 meses, 10 clientes).
 *
 * @param feederId - Alimentador aberto na gaveta; `null` desliga a consulta.
 * @returns Opções de query habilitada apenas com alimentador selecionado.
 */
export function affectedCustomersQueryOptions(feederId: string | null) {
  return queryOptions({
    queryKey: qualityKeys.customers(feederId ?? ''),
    queryFn: ({ signal }) => qualityApi.getAffectedCustomers(feederId ?? '', signal),
    enabled: feederId !== null,
    staleTime: QUALITY_STALE_TIME_MS
  })
}
