import { apiClient } from '@/lib/api-client'
import type {
  FeederHistory,
  FeederRanking,
  QualityIndicators,
  QualityStatus
} from '@/features/grid_quality/types/qualityTypes'

export const qualityApi = {
  async getIndicators(signal?: AbortSignal): Promise<QualityIndicators> {
    const { data } = await apiClient.get<QualityIndicators>('/quality/indicators', { signal })
    return data
  },

  async listFeeders(status: QualityStatus | undefined, signal?: AbortSignal): Promise<FeederRanking[]> {
    const { data } = await apiClient.get<FeederRanking[]>('/quality/feeders', {
      params: status ? { status } : undefined,
      signal
    })
    return data
  },

  async getFeederHistory(feederId: string, signal?: AbortSignal): Promise<FeederHistory> {
    const { data } = await apiClient.get<FeederHistory>(
      `/quality/feeders/${encodeURIComponent(feederId)}/history`,
      { signal }
    )
    return data
  }
}
