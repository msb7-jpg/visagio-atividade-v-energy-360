import { SlidersHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { NeighborhoodHistorySheet } from '@/features/revenue/components/NeighborhoodHistorySheet'
import { RevenueFiltersBar } from '@/features/revenue/components/RevenueFiltersBar'
import { RevenueResults } from '@/features/revenue/components/RevenueResults'
import { useRevenueDashboardController } from '@/features/revenue/hooks/useRevenueDashboardController'
import { distinctValues } from '@/features/revenue/utils/revenueOptions'

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
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight">Inteligência Comercial</h1>
        <p className="text-muted-foreground text-sm">
          Por que a receita variou: quanto veio de preço, de volume e de mix, e onde a perda de volume se concentra.
        </p>
      </div>

      <RevenueFiltersBar
        query={query}
        windowError={windowError}
        municipalities={distinctValues(dashboard.municipalitiesQuery.data, 'municipio')}
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
        onClose={ranking.closeNeighborhood}
      />
    </main>
  )
}
