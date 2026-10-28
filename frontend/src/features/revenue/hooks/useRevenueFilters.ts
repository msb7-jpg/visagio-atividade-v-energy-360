import { useState } from 'react'
import type { RevenueFilters, RevenueQuery } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_REVENUE_QUERY, validateRevenueQuery } from '@/features/revenue/utils/revenueFilters'

export type WindowName = 'base' | 'atual'
export type WindowEdge = 'inicio' | 'fim'

/**
 * Estado dos filtros da tela (janelas e recortes) com a validação das janelas.
 *
 * @returns Seleção atual, mensagem de erro das janelas e funções para alterar ou restaurar a seleção.
 */
export function useRevenueFilters() {
  const [query, setQuery] = useState<RevenueQuery>(DEFAULT_REVENUE_QUERY)

  const changeMonth = (window: WindowName, edge: WindowEdge, month: string) => {
    // O campo de mês devolve texto vazio enquanto é limpo; ignora para não enviar janela quebrada.
    if (month === '') {
      return
    }
    setQuery((current) => ({ ...current, [window]: { ...current[window], [edge]: month } }))
  }

  const changeFilter = (name: keyof RevenueFilters, filterValue: string) => {
    setQuery((current) => {
      // O mesmo nome de bairro pode existir em municípios diferentes: trocar o município limpa o bairro.
      const clearedNeighborhood = name === 'municipio' ? { bairro: undefined } : {}
      return { ...current, filters: { ...current.filters, ...clearedNeighborhood, [name]: filterValue || undefined } }
    })
  }

  const reset = () => setQuery(DEFAULT_REVENUE_QUERY)

  return { query, windowError: validateRevenueQuery(query), changeMonth, changeFilter, reset }
}
