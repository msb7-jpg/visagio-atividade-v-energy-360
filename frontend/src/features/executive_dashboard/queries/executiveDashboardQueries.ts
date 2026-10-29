import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { executiveDashboardApi } from '@/features/executive_dashboard/api/executiveDashboardApi'
import type { DashboardPeriods } from '@/features/executive_dashboard/types/executiveDashboardTypes'

export const executiveDashboardKeys = {
  all: ['executive-dashboard'] as const,
  indicators: (periods: DashboardPeriods) => [...executiveDashboardKeys.all, 'indicators', periods] as const,
  losses: () => [...executiveDashboardKeys.all, 'losses'] as const
}

// Os indicadores somam milhões de faturas e leituras de meses fechados: cache longo evita recalcular ao voltar.
const DASHBOARD_STALE_TIME_MS = 10 * 60 * 1000

/**
 * Opções da consulta dos indicadores comparados entre as duas janelas.
 *
 * @param periods - Janela base e janela atual escolhidas pelo diretor.
 * @returns Opções de query que mantêm os números anteriores enquanto os novos períodos carregam.
 */
export function indicatorsQueryOptions(periods: DashboardPeriods) {
  return queryOptions({
    queryKey: executiveDashboardKeys.indicators(periods),
    queryFn: ({ signal }) => executiveDashboardApi.getIndicators(periods, signal),
    staleTime: DASHBOARD_STALE_TIME_MS,
    placeholderData: keepPreviousData
  })
}

/**
 * Opções da consulta do retrato atual da Fila de Perdas.
 *
 * @returns Opções de query com cancelamento via signal.
 */
export function lossesSnapshotQueryOptions() {
  return queryOptions({
    queryKey: executiveDashboardKeys.losses(),
    queryFn: ({ signal }) => executiveDashboardApi.getLossesSnapshot(signal),
    staleTime: DASHBOARD_STALE_TIME_MS
  })
}
