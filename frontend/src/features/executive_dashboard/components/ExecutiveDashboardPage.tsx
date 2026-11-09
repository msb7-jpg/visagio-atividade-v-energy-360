import { useMemo } from 'react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { GroupHeading } from '@/features/executive_dashboard/components/GroupHeading'
import { IndicatorGroups } from '@/features/executive_dashboard/components/IndicatorGroups'
import { LossesSnapshotCard } from '@/features/executive_dashboard/components/LossesSnapshotCard'
import { PeriodSelector } from '@/features/executive_dashboard/components/PeriodSelector'
import { ScoreboardPanel } from '@/features/executive_dashboard/components/ScoreboardPanel'
import { VariationChart } from '@/features/executive_dashboard/components/VariationChart'
import { useExecutiveDashboardController } from '@/features/executive_dashboard/hooks/useExecutiveDashboardController'
import type { IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { competenciasOf } from '@/features/executive_dashboard/utils/dashboardPeriods'
import { extractMetricsFromGroups } from '@/features/executive_dashboard/utils/dashboardSummary'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'
import { formatMonth } from '@/lib/periods/periodPresets'

const FALLBACK_AVAILABLE_PERIOD = { competencia_inicio: '2022-07', competencia_fim: '2026-06' }

/** Mês do retrato da Fila de Perdas, ao lado do título da seção. */
function LossesReference({ reference }: { reference?: string | null }) {
  if (!reference) return null
  return (
    <span className="flex items-center gap-2">
      <span className="text-foreground text-sm font-medium">{formatMonth(reference)}</span>
      <Badge variant="muted">Retrato atual</Badge>
    </span>
  )
}

const SECTION_LABEL = 'text-muted-foreground text-xs font-semibold tracking-wide uppercase'

/**
 * Visão geral e detalhe dos indicadores: primeiro o placar e o gráfico do que mais mudou, lado a lado,
 * depois os blocos de cada área com os dois períodos.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns As duas faixas do Painel.
 */
function IndicatorsOverview({ groups }: { groups: IndicatorGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Visão geral" className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <ScoreboardPanel groups={groups} />
        </div>
        <div className="min-w-0 xl:col-span-7">
          <VariationChart groups={groups} />
        </div>
      </section>
      <section aria-labelledby="detalhe-areas" className="flex flex-col gap-4">
        <h2 id="detalhe-areas" className={SECTION_LABEL}>Indicadores por área</h2>
        <IndicatorGroups groups={groups} />
      </section>
    </div>
  )
}

/**
 * Painel do Diretor: os principais indicadores do negócio comparados entre dois períodos (case, seção 5.2).
 *
 * @returns Seletor de períodos, resumo da IA, placar, gráfico de variação, blocos por área e o retrato da
 * Fila de Perdas.
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
    <main className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader title="Painel do Diretor" description="Desempenho do negócio frente ao período base." />

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
          <IndicatorsOverview groups={groups} />
        </AsyncState>
      ) : null}

      <section aria-labelledby="grupo-perdas" className="flex flex-col gap-2 pt-2">
        <GroupHeading id="perdas" title="Perdas" aside={<LossesReference reference={losses.data?.competencia_referencia} />} />
        <div className="min-w-0">
          <AsyncState
            isLoading={losses.isLoading}
            isError={losses.isError}
            errorTitle="Não foi possível carregar a Fila de Perdas"
            onRetry={() => void losses.refetch()}
            skeletonCount={2}
          >
            {losses.data ? <LossesSnapshotCard snapshot={losses.data} /> : null}
          </AsyncState>
        </div>
      </section>
    </main>
  )
}
