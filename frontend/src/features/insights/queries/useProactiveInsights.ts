import { queryOptions, useQuery } from '@tanstack/react-query'
import {
  fetchProactiveInsights,
  type ProactiveInsightsData,
  type ProactiveInsightsPayload
} from '@/features/insights/api/insightsApi'

const insightsQueryKeys = {
  all: ['insights'] as const,
  detail: (payload: ProactiveInsightsPayload) =>
    ['insights', payload.context, payload.filtros, payload.metricas] as const
}

function proactiveInsightsQueryOptions(payload: ProactiveInsightsPayload) {
  return queryOptions<ProactiveInsightsData>({
    queryKey: insightsQueryKeys.detail(payload),
    queryFn: ({ signal }) => fetchProactiveInsights(payload, signal),
    staleTime: 5 * 60 * 1000,
    retry: false
  })
}

/**
 * Hook para consulta proativa automática de insights da IA.
 *
 * @param payload - Contexto e métricas do painel em visualização.
 * @returns Estado da consulta contendo dados, status e loading.
 */
export function useProactiveInsights(payload: ProactiveInsightsPayload) {
  return useQuery(proactiveInsightsQueryOptions(payload))
}
