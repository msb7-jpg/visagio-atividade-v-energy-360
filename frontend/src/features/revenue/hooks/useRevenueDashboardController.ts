import { useRevenueFilters } from '@/features/revenue/hooks/useRevenueFilters'
import {
  useRevenueBreakdownQuery,
  useRevenueDecompositionQuery,
  useRevenueHistoryQuery,
  useRevenueKpisQuery,
  useRevenueOptionsQuery
} from '@/features/revenue/hooks/useRevenueQueries'
import { useRevenueRankingControls } from '@/features/revenue/hooks/useRevenueRankingControls'
import type { RevenueFilters } from '@/features/revenue/types/revenueTypes'
import type { WindowEdge, WindowName } from '@/features/revenue/hooks/useRevenueFilters'

/**
 * Controlador headless do dashboard de receita: junta filtros, ranking e todas as consultas.
 * Nenhuma consulta é disparada enquanto as janelas estiverem inválidas.
 *
 * @returns Seleção, estado das consultas e ações da tela.
 */
export function useRevenueDashboardController() {
  const filters = useRevenueFilters()
  const ranking = useRevenueRankingControls()
  const { query, windowError } = filters
  const enabled = windowError === null

  const kpisQuery = useRevenueKpisQuery(query, enabled)
  const decompositionQuery = useRevenueDecompositionQuery(query, enabled)
  const breakdownQuery = useRevenueBreakdownQuery(query, ranking.controls, enabled)
  const municipalitiesQuery = useRevenueOptionsQuery(query, 'municipio', enabled)
  const classesQuery = useRevenueOptionsQuery(query, 'classe_consumo', enabled)
  // Bairros só são listados depois de escolher o município (o mesmo nome pode se repetir entre municípios).
  const { municipio } = query.filters
  const neighborhoodsQuery = useRevenueOptionsQuery(query, 'bairro', enabled && Boolean(municipio), { municipio })
  const historyQuery = useRevenueHistoryQuery(query, ranking.selected)

  // Qualquer mudança de recorte volta o ranking para a primeira página.
  const changeMonth = (window: WindowName, edge: WindowEdge, month: string) => {
    filters.changeMonth(window, edge, month)
    ranking.resetPage()
  }
  const changeFilter = (name: keyof RevenueFilters, filterValue: string) => {
    filters.changeFilter(name, filterValue)
    ranking.resetPage()
  }
  const reset = () => {
    filters.reset()
    ranking.resetPage()
  }

  return {
    query,
    windowError,
    changeMonth,
    changeFilter,
    reset,
    ranking,
    kpisQuery,
    decompositionQuery,
    breakdownQuery,
    municipalitiesQuery,
    classesQuery,
    neighborhoodsQuery,
    historyQuery
  }
}
