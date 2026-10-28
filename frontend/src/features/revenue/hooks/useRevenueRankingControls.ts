import { useState } from 'react'
import type {
  BreakdownControls,
  BreakdownLevel,
  BreakdownSortField,
  NeighborhoodRef
} from '@/features/revenue/types/revenueTypes'
import { DEFAULT_BREAKDOWN_CONTROLS } from '@/features/revenue/utils/revenueFilters'

// Receita atual é lida do maior para o menor; os demais campos põem a maior perda primeiro.
const DESC_FIRST_FIELD: BreakdownSortField = 'receita_atual_rs'

/**
 * Estado do ranking: nível, ordenação, página e bairro aberto na gaveta de histórico.
 *
 * @returns Controles atuais, bairro selecionado e as ações que os alteram.
 */
export function useRevenueRankingControls() {
  const [controls, setControls] = useState<BreakdownControls>(DEFAULT_BREAKDOWN_CONTROLS)
  const [selected, setSelected] = useState<NeighborhoodRef | null>(null)

  const changeLevel = (nivel: BreakdownLevel) => setControls((current) => ({ ...current, nivel, page: 1 }))

  const toggleSort = (field: BreakdownSortField) =>
    setControls((current) => {
      if (current.ordenar_por === field) {
        return { ...current, ordem: current.ordem === 'asc' ? 'desc' : 'asc', page: 1 }
      }
      return { ...current, ordenar_por: field, ordem: field === DESC_FIRST_FIELD ? 'desc' : 'asc', page: 1 }
    })

  const changePage = (page: number) => setControls((current) => ({ ...current, page }))
  const resetPage = () => setControls((current) => (current.page === 1 ? current : { ...current, page: 1 }))

  return {
    controls,
    selected,
    changeLevel,
    toggleSort,
    changePage,
    resetPage,
    openNeighborhood: setSelected,
    closeNeighborhood: () => setSelected(null)
  }
}
