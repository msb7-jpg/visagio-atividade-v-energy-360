import { continuityDataset } from '@/features/grid_quality/mocks/continuityMock'
import type { ContinuityFilters, ContinuitySnapshot } from '@/features/grid_quality/types/continuityTypes'
import { buildContinuitySnapshot } from '@/features/grid_quality/utils/continuityAggregations'

/** Camada de acesso da tela de Continuidade; trocar o corpo por `fetch` quando a API real existir. */
export const continuityApi = {
  municipalityNames: continuityDataset.municipalities.map((municipality) => municipality.name),
  async getSnapshot(filters: ContinuityFilters): Promise<ContinuitySnapshot> {
    return buildContinuitySnapshot(continuityDataset, filters)
  }
}
