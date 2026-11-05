import { SlidersHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { NeighborhoodHistorySheet } from '@/features/revenue/components/NeighborhoodHistorySheet'
import { RevenueFiltersBar } from '@/features/revenue/components/RevenueFiltersBar'
import { RevenueResults } from '@/features/revenue/components/RevenueResults'
import { useRevenueDashboardController } from '@/features/revenue/hooks/useRevenueDashboardController'
import { distinctValues } from '@/features/revenue/utils/revenueOptions'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Dashboard executivo de receita (perfil diretor): filtros, indicadores, ponte Preço-Volume-Mix e ranking.
 *
 * @returns Página com cabeçalho, filtros, resultados e gaveta de histórico do bairro.
 */
export function RevenueDashboardPage() {
  const dashboard = useRevenueDashboardController()
  const { query, windowError, historyQuery, ranking } = dashboard

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Inteligência Comercial"
        description="Quanto da variação da receita veio de preço, volume e mix, e onde o volume caiu."
      />

      <RevenueFiltersBar
        query={query}
        windowError={windowError}
        municipalities={distinctValues(dashboard.municipalitiesQuery.data, 'municipio')}
        neighborhoods={distinctValues(dashboard.neighborhoodsQuery.data, 'bairro')}
        classes={distinctValues(dashboard.classesQuery.data, 'classe_consumo')}
        onMonthChange={dashboard.changeMonth}
        onFilterChange={dashboard.changeFilter}
        onReset={dashboard.reset}
      />

      {windowError ? (
        <EmptyState
          title="Ajuste os períodos para ver os resultados"
          description="Enquanto as janelas estiverem inválidas, nenhuma consulta é feita."
          icon={<SlidersHorizontal className="size-10" />}
        />
      ) : (
        <RevenueResults dashboard={dashboard} />
      )}

      <NeighborhoodHistorySheet
        neighborhood={ranking.selected}
        history={historyQuery.data}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        error={historyQuery.error}
        onRetry={() => void historyQuery.refetch()}
        onClose={ranking.closeNeighborhood}
      />
    </main>
  )
}
