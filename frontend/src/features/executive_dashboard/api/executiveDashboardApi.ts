import { apiClient } from '@/lib/api-client'
import type {
  DashboardIndicators,
  DashboardPeriods,
  LossesSnapshot
} from '@/features/executive_dashboard/types/executiveDashboardTypes'

export const executiveDashboardApi = {
  async getIndicators(periods: DashboardPeriods, signal?: AbortSignal): Promise<DashboardIndicators> {
    const { data } = await apiClient.get<DashboardIndicators>('/dashboard/indicators', {
      params: {
        base_inicio: periods.base.competencia_inicio,
        base_fim: periods.base.competencia_fim,
        atual_inicio: periods.atual.competencia_inicio,
        atual_fim: periods.atual.competencia_fim
      },
      signal
    })
    return data
  },

  async getLossesSnapshot(signal?: AbortSignal): Promise<LossesSnapshot> {
    const { data } = await apiClient.get<LossesSnapshot>('/dashboard/losses', { signal })
    return data
  }
}
