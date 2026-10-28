import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { continuityQueryOptions } from '@/features/grid_quality/queries/continuityQueries'
import { MUNICIPALITY_NAMES } from '@/features/grid_quality/utils/continuityMunicipalities'

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
    municipalityNames: MUNICIPALITY_NAMES,
    snapshot
  }
}
