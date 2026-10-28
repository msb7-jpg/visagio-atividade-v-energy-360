import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  affectedCustomersQueryOptions,
  feederHistoryQueryOptions,
  feedersQueryOptions,
  indicatorsQueryOptions
} from '@/features/grid_quality/queries/qualityQueries'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'

/**
 * Controlador da tela de qualidade da rede: filtro de status, alimentador aberto e consultas.
 *
 * @returns Estado dos filtros, dados das consultas e ações da tela.
 */
export function useGridQualityController() {
  const [status, setStatus] = useState<QualityStatus | undefined>(undefined)
  const [selectedFeederId, setSelectedFeederId] = useState<string | null>(null)

  const indicators = useQuery(indicatorsQueryOptions())
  const feeders = useQuery(feedersQueryOptions(status))
  const history = useQuery(feederHistoryQueryOptions(selectedFeederId))
  const customers = useQuery(affectedCustomersQueryOptions(selectedFeederId))

  return {
    status,
    setStatus,
    selectedFeederId,
    openFeeder: setSelectedFeederId,
    closeFeeder: () => setSelectedFeederId(null),
    indicators,
    feeders,
    history,
    customers
  }
}
