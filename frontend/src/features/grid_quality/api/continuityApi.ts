import { apiClient } from '@/lib/api-client'
import type { ContinuityFilters, ContinuitySnapshot } from '@/features/grid_quality/types/continuityTypes'

/** Camada de acesso da tela de Continuidade (`GET /quality/continuity`). */
export const continuityApi = {
  async getSnapshot(filters: ContinuityFilters, signal?: AbortSignal): Promise<ContinuitySnapshot> {
    const { data } = await apiClient.get<ContinuitySnapshot>('/quality/continuity', {
      params: {
        municipio: filters.municipality === '' ? undefined : filters.municipality,
        incluir_evento: filters.includeEventMonth
      },
      signal
    })
    return data
  }
}
