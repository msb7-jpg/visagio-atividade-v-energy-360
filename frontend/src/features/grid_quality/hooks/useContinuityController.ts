import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { continuityApi } from '@/features/grid_quality/api/continuityApi'
import { continuityQueryOptions } from '@/features/grid_quality/queries/continuityQueries'

/**
 * Controlador da visão de Continuidade: filtros (mês do evento e município) e consulta.
 *
 * @returns Estado dos filtros, lista de municípios e a consulta do snapshot.
 */
export function useContinuityController() {
  const [includeEventMonth, setIncludeEventMonth] = useState(true)
  const [municipality, setMunicipality] = useState('')
  const snapshot = useQuery(continuityQueryOptions({ includeEventMonth, municipality }))

  return {
    includeEventMonth,
    setIncludeEventMonth,
    municipality,
    setMunicipality,
    municipalityNames: continuityApi.municipalityNames,
    snapshot
  }
}
