import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { continuityQueryOptions } from '@/features/grid_quality/queries/continuityQueries'
import { MUNICIPALITY_NAMES } from '@/features/grid_quality/utils/continuityMunicipalities'

/**
 * Controlador da visão de Continuidade: filtros (mês do evento, município e causa) e consulta.
 * As opções de causa vêm do próprio snapshot (bloco de causas, que não muda com a causa escolhida).
 *
 * @returns Estado dos filtros, listas de municípios e causas e a consulta do snapshot.
 */
export function useContinuityController() {
  const [includeEventMonth, setIncludeEventMonth] = useState(true)
  const [municipality, setMunicipality] = useState('')
  const [cause, setCause] = useState('')
  const snapshot = useQuery(continuityQueryOptions({ includeEventMonth, municipality, cause }))
  const snapshotCauses = snapshot.data?.causes.map((share) => share.cause) ?? []
  // Mantém a causa escolhida na lista mesmo se o município novo não tiver ocorrências dela.
  const causeOptions = cause === '' || snapshotCauses.includes(cause) ? snapshotCauses : [cause, ...snapshotCauses]

  return {
    includeEventMonth,
    setIncludeEventMonth,
    municipality,
    setMunicipality,
    cause,
    setCause,
    causeOptions,
    municipalityNames: MUNICIPALITY_NAMES,
    snapshot
  }
}
