import { apiClient } from '@/lib/api-client'
import type {
  BreakdownControls,
  BreakdownPage,
  NeighborhoodHistory,
  NeighborhoodRef,
  PriceVolumeDecomposition,
  RevenueKpis,
  RevenueQuery
} from '@/features/revenue/types/revenueTypes'
import { toApiParams, toBreakdownParams, toHistoryParams } from '@/features/revenue/utils/revenueFilters'

/** Chamadas HTTP da fatia de Inteligência Comercial (todas restritas ao perfil diretor). */
export const revenueApi = {
  async getKpis(query: RevenueQuery, signal?: AbortSignal): Promise<RevenueKpis> {
    const { data } = await apiClient.get<RevenueKpis>('/revenue/kpis', { params: toApiParams(query), signal })
    return data
  },

  async getDecomposition(query: RevenueQuery, signal?: AbortSignal): Promise<PriceVolumeDecomposition> {
    const { data } = await apiClient.get<PriceVolumeDecomposition>('/revenue/decomposition', {
      params: toApiParams(query),
      signal
    })
    return data
  },

  async getBreakdown(query: RevenueQuery, controls: BreakdownControls, signal?: AbortSignal): Promise<BreakdownPage> {
    const { data } = await apiClient.get<BreakdownPage>('/revenue/breakdown', {
      params: toBreakdownParams(query, controls),
      signal
    })
    return data
  },

  async getHistory(query: RevenueQuery, neighborhood: NeighborhoodRef, signal?: AbortSignal): Promise<NeighborhoodHistory> {
    const { data } = await apiClient.get<NeighborhoodHistory>('/revenue/history', {
      params: toHistoryParams(query, neighborhood),
      signal
    })
    return data
  }
}
