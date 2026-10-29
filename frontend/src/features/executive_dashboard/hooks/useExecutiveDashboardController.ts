import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  indicatorsQueryOptions,
  lossesSnapshotQueryOptions
} from '@/features/executive_dashboard/queries/executiveDashboardQueries'
import type { DashboardPeriods } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import {
  DEFAULT_PERIODS,
  isDefaultPeriods,
  periodsFromParams,
  periodsProblem,
  periodsToParams
} from '@/features/executive_dashboard/utils/dashboardPeriods'

/**
 * Controller headless do Painel do Diretor: as janelas comparadas vivem no endereço da página
 * (`?base_inicio=2022-07&...`), o que permite atualizar, voltar e compartilhar o link sem perder a comparação.
 *
 * @returns Janelas em uso, ações de troca, problema de validação e as consultas de indicadores e perdas.
 */
export function useExecutiveDashboardController() {
  const [searchParams, setSearchParams] = useSearchParams()
  const periods = periodsFromParams(searchParams)
  const problem = periodsProblem(periods)

  const indicators = useQuery({ ...indicatorsQueryOptions(periods), enabled: problem === null })
  const losses = useQuery(lossesSnapshotQueryOptions())

  const changePeriods = (nextPeriods: DashboardPeriods) => {
    setSearchParams(isDefaultPeriods(nextPeriods) ? {} : periodsToParams(nextPeriods))
  }

  return {
    periods,
    problem,
    isDefault: isDefaultPeriods(periods),
    changePeriods,
    resetPeriods: () => changePeriods(DEFAULT_PERIODS),
    indicators,
    losses
  }
}
