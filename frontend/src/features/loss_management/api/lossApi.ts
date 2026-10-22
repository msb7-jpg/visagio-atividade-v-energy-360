import { apiClient } from '@/lib/api-client'
import type {
  InspectionOrder,
  InspectionOrderCreate,
  InspectionOrderUpdate,
  InspectionStatus,
  SuspiciousQueue,
  SuspiciousUnitsFilter
} from '@/features/loss_management/types/lossTypes'

export const lossApi = {
  async listSuspiciousUnits(filters: SuspiciousUnitsFilter, signal?: AbortSignal): Promise<SuspiciousQueue> {
    const { data } = await apiClient.get<SuspiciousQueue>('/losses/suspicious-units', {
      params: filters,
      signal
    })
    return data
  },

  async listInspections(status: InspectionStatus | undefined, signal?: AbortSignal): Promise<InspectionOrder[]> {
    const { data } = await apiClient.get<InspectionOrder[]>('/losses/inspections', {
      params: status ? { status } : undefined,
      signal
    })
    return data
  },

  async createInspection(payload: InspectionOrderCreate): Promise<InspectionOrder> {
    const { data } = await apiClient.post<InspectionOrder>('/losses/inspections', payload)
    return data
  },

  async updateInspection(idInspecao: number, payload: InspectionOrderUpdate): Promise<InspectionOrder> {
    const { data } = await apiClient.patch<InspectionOrder>(`/losses/inspections/${idInspecao}`, payload)
    return data
  }
}
