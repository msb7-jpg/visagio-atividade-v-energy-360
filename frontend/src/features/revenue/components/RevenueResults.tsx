import { BarChart3, MapPinned } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'
import { RevenueKpiCards } from '@/features/revenue/components/RevenueKpiCards'
import { AsyncState } from '@/components/feedback/AsyncState'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'
import { buildInsightFilters, buildInsightMetrics } from '@/features/revenue/utils/revenueInsightContext'
import { RevenueRankingCard } from '@/features/revenue/components/RevenueRankingCard'
import { RevenueWaterfallCard } from '@/features/revenue/components/RevenueWaterfallCard'
import type { useRevenueDashboardController } from '@/features/revenue/hooks/useRevenueDashboardController'

type Dashboard = ReturnType<typeof useRevenueDashboardController>

/**
 * Resultados do dashboard: indicadores e as abas de decomposição e ranking territorial.
 * Se os indicadores falham (ex.: recorte sem faturamento), mostra só esse erro, já que todas as consultas
 * dependem das mesmas janelas e filtros.
 *
 * @param props - Controlador do dashboard com o estado das consultas.
 * @returns Cards de indicadores, o Smart Insight da tela e as abas, ou o estado de erro.
 */
export function RevenueResults({ dashboard }: { dashboard: Dashboard }) {
  const { query, kpisQuery, decompositionQuery, breakdownQuery, ranking } = dashboard
  // Na troca de recorte o React Query mostra os números antigos; só vale consultar a IA com os novos.
  const hasFreshResults = !kpisQuery.isPlaceholderData && !decompositionQuery.isPlaceholderData
  return (
    <>
      <AsyncState
        isLoading={kpisQuery.isLoading}
        isError={kpisQuery.isError}
        errorTitle="Não foi possível carregar os indicadores"
        errorDescription={getRevenueErrorMessage(kpisQuery.error)}
        skeletonCount={2}
      >
        {kpisQuery.data ? <RevenueKpiCards kpis={kpisQuery.data} /> : null}
      </AsyncState>

      {hasFreshResults && kpisQuery.data && decompositionQuery.data ? (
        <SmartInsightCard
          context="revenue"
          filters={buildInsightFilters(query)}
          metrics={buildInsightMetrics(decompositionQuery.data, kpisQuery.data)}
        />
      ) : null}

      {kpisQuery.isError ? null : (
        <Tabs defaultValue="decomposition">
          <TabsList>
            <TabsTrigger value="decomposition">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="size-4" /> Decomposição
              </span>
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <span className="flex items-center gap-1.5">
                <MapPinned className="size-4" /> Ranking territorial
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="decomposition" className="mt-4">
            <RevenueWaterfallCard
              decomposition={decompositionQuery.data}
              isLoading={decompositionQuery.isLoading}
              isError={decompositionQuery.isError}
              error={decompositionQuery.error}
            />
          </TabsContent>
          <TabsContent value="ranking" className="mt-4">
            <RevenueRankingCard breakdownQuery={breakdownQuery} ranking={ranking} />
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}
