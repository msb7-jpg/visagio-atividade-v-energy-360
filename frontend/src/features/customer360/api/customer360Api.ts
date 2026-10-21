import { apiClient } from '@/lib/api-client'
import type {
  CustomerEventTimeline,
  CustomerHistory,
  CustomerSummary
} from '@/features/customer360/types/customer360Types'

function customerPath(idUc: string, resource: string): string {
  return `/customers/${encodeURIComponent(idUc)}/${resource}`
}

export const customer360Api = {
  async getSummary(idUc: string, signal?: AbortSignal): Promise<CustomerSummary> {
    const { data } = await apiClient.get<CustomerSummary>(customerPath(idUc, 'summary'), { signal })
    return data
  },

  async getHistory(idUc: string, signal?: AbortSignal): Promise<CustomerHistory> {
    const { data } = await apiClient.get<CustomerHistory>(customerPath(idUc, 'history'), { signal })
    return data
  },

  async getEvents(idUc: string, signal?: AbortSignal): Promise<CustomerEventTimeline> {
    const { data } = await apiClient.get<CustomerEventTimeline>(customerPath(idUc, 'events'), { signal })
    return data
  }
}
