import { apiClient } from '@/lib/api-client'
import { parseBlobErrorBody } from '@/features/loss_management/utils/blobErrorBody'
import type {
  InspectionOrder,
  InspectionOrderCreate,
  InspectionOrderUpdate,
  InspectionStatus,
  QueueFilterOptions,
  QueueSummary,
  SuspiciousQueue,
  SuspiciousUnitsFilter,
  UploadResult
} from '@/features/loss_management/types/lossTypes'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'

export const lossApi = {
  async listSuspiciousUnits(filters: SuspiciousUnitsFilter, signal?: AbortSignal): Promise<SuspiciousQueue> {
    const { data } = await apiClient.get<SuspiciousQueue>('/losses/suspicious-units', {
      params: filters,
      signal
    })
    return data
  },

  async getUnitDetail(idUc: string, signal?: AbortSignal): Promise<UnitDetail> {
    const { data } = await apiClient.get<UnitDetail>(`/losses/suspicious-units/${encodeURIComponent(idUc)}`, { signal })
    return data
  },

  async getQueueSummary(selectedIds: string[], signal?: AbortSignal): Promise<QueueSummary> {
    // `indexes: null` envia `ucs=UC1&ucs=UC2`, formato que o FastAPI lê como lista (sem os colchetes do axios).
    const { data } = await apiClient.get<QueueSummary>('/losses/queue-summary', {
      params: { ucs: selectedIds },
      paramsSerializer: { indexes: null },
      signal
    })
    return data
  },

  async getQueueFilters(signal?: AbortSignal): Promise<QueueFilterOptions> {
    const { data } = await apiClient.get<QueueFilterOptions>('/losses/queue-filters', { signal })
    return data
  },

  async listInspections(status: InspectionStatus | undefined, signal?: AbortSignal): Promise<InspectionOrder[]> {
    const { data } = await apiClient.get<InspectionOrder[]>('/losses/inspections', {
      params: status ? { status } : undefined,
      signal
    })
    return data
  },

  async exportInspections(signal?: AbortSignal): Promise<Blob> {
    try {
      const { data } = await apiClient.get<Blob>('/losses/inspections/export', { responseType: 'blob', signal })
      return data
    } catch (error) {
      throw await parseBlobErrorBody(error)
    }
  },

  async createInspection(payload: InspectionOrderCreate): Promise<InspectionOrder> {
    const { data } = await apiClient.post<InspectionOrder>('/losses/inspections', payload)
    return data
  },

  async uploadFieldResults(file: File): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<UploadResult>('/losses/inspections/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async updateInspection(idInspecao: number, payload: InspectionOrderUpdate): Promise<InspectionOrder> {
    const { data } = await apiClient.patch<InspectionOrder>(`/losses/inspections/${idInspecao}`, payload)
    return data
  }
}
