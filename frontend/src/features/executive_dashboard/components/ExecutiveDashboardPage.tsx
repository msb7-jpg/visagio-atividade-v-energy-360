import { useMemo } from 'react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { IndicatorsTable } from '@/features/executive_dashboard/components/IndicatorsTable'
import { LossesSnapshotCard } from '@/features/executive_dashboard/components/LossesSnapshotCard'
import { PeriodSelector } from '@/features/executive_dashboard/components/PeriodSelector'
import { useExecutiveDashboardController } from '@/features/executive_dashboard/hooks/useExecutiveDashboardController'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { competenciasOf, describeWindow } from '@/features/executive_dashboard/utils/dashboardPeriods'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'

const FALLBACK_AVAILABLE_PERIOD = { competencia_inicio: '2022-07', competencia_fim: '2026-06' }

function recordIndicatorMetrics(
  metricMap: Record<string, string | number>,
  indicator: Indicator
): void {
  if (indicator.atual !== null) metricMap[`${indicator.id}_atual`] = indicator.atual
  if (indicator.base !== null) metricMap[`${indicator.id}_base`] = indicator.base
  if (indicator.variacao_pct !== null) metricMap[`${indicator.id}_var_pct`] = indicator.variacao_pct
  if (indicator.variacao_pp !== null) metricMap[`${indicator.id}_var_pp`] = indicator.variacao_pp
}

function extractMetricsFromGroups(
  groups?: IndicatorGroup[]
): Record<string, string | number> | undefined {
  if (!groups) return undefined
  const metricMap: Record<string, string | number> = {}
  for (const group of groups) {
    for (const indicator of group.indicadores) {
      recordIndicatorMetrics(metricMap, indicator)
    }
  }
  return metricMap
}

/**
 * Painel do Diretor: os principais indicadores do negócio comparados entre dois períodos (case, seção 5.2).
 *
 * @returns Seletor de períodos, um bloco por área do negócio e o retrato atual da Fila de Perdas.
 */
export function ExecutiveDashboardPage() {
  const { periods, problem, isDefault, changePeriods, resetPeriods, indicators, losses } =
    useExecutiveDashboardController()
  const groups = indicators.data?.grupos ?? []
  const months = competenciasOf(indicators.data?.periodo_disponivel ?? FALLBACK_AVAILABLE_PERIOD)

  const executiveMetrics = useMemo(
    () => extractMetricsFromGroups(indicators.data?.grupos),
    [indicators.data?.grupos]
  )

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight">Painel do Diretor</h1>
        <p className="text-muted-foreground text-sm">
          Compara {describeWindow(periods.atual)} com {describeWindow(periods.base)}. Passe o mouse no nome de
          cada indicador para ver como ele é calculado.
        </p>
      </div>

      <PeriodSelector
        periods={periods}
        months={months}
        isDefault={isDefault}
        problem={problem}
        onChange={changePeriods}
        onReset={resetPeriods}
      />

      <SmartInsightCard
        context="executive"
        filters={{
          base: `${periods.base.competencia_inicio} a ${periods.base.competencia_fim}`,
          atual: `${periods.atual.competencia_inicio} a ${periods.atual.competencia_fim}`
        }}
        metrics={executiveMetrics}
      />

      {problem === null ? (
        <AsyncState
          isLoading={indicators.isLoading}
          isError={indicators.isError}
          isEmpty={groups.length === 0}
          errorTitle="Não foi possível carregar os indicadores"
          errorDescription="Confira se há faturamento nos períodos escolhidos ou tente de novo."
          onRetry={() => void indicators.refetch()}
          emptyTitle="Nenhum indicador para os períodos escolhidos"
          skeletonCount={6}
        >
          <IndicatorsTable groups={groups} />
        </AsyncState>
      ) : null}

      <section aria-labelledby="grupo-perdas" className="flex flex-col gap-3">
        <h2 id="grupo-perdas" className="text-foreground text-lg font-semibold">Perdas</h2>
        <AsyncState
          isLoading={losses.isLoading}
          isError={losses.isError}
          errorTitle="Não foi possível carregar a Fila de Perdas"
          onRetry={() => void losses.refetch()}
          skeletonCount={2}
        >
          {losses.data ? <LossesSnapshotCard snapshot={losses.data} /> : null}
        </AsyncState>
      </section>
    </main>
  )
}
