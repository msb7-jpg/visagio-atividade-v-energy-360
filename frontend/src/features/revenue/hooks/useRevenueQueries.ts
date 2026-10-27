import { useQuery } from '@tanstack/react-query'
import {
  revenueBreakdownQueryOptions,
  revenueDecompositionQueryOptions,
  revenueHistoryQueryOptions,
  revenueKpisQueryOptions,
  revenueOptionsQueryOptions
} from '@/features/revenue/queries/revenueQueries'
import type {
  BreakdownControls,
  BreakdownLevel,
  NeighborhoodRef,
  RevenueQuery
} from '@/features/revenue/types/revenueTypes'

/**
 * Indicadores executivos de receita nas duas janelas.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param enabled - `false` quando as janelas são inválidas.
 * @returns Estado da query de KPIs.
 */
export function useRevenueKpisQuery(query: RevenueQuery, enabled: boolean) {
  return useQuery(revenueKpisQueryOptions(query, enabled))
}

/**
 * Decomposição Preço-Volume-Mix da variação de receita.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param enabled - `false` quando as janelas são inválidas.
 * @returns Estado da query de decomposição.
 */
export function useRevenueDecompositionQuery(query: RevenueQuery, enabled: boolean) {
  return useQuery(revenueDecompositionQueryOptions(query, enabled))
}

/**
 * Ranking paginado da variação de receita.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param controls - Nível, ordenação e página.
 * @param enabled - `false` quando as janelas são inválidas.
 * @returns Estado da query do ranking.
 */
export function useRevenueBreakdownQuery(query: RevenueQuery, controls: BreakdownControls, enabled: boolean) {
  return useQuery(revenueBreakdownQueryOptions(query, controls, enabled))
}

/**
 * Valores existentes de um nível (municípios ou classes) para os seletores de filtro.
 *
 * @param query - Janelas escolhidas.
 * @param nivel - Nível que alimenta o seletor.
 * @param enabled - `false` quando as janelas são inválidas.
 * @returns Estado da query com as linhas do nível.
 */
export function useRevenueOptionsQuery(query: RevenueQuery, nivel: BreakdownLevel, enabled: boolean) {
  return useQuery(revenueOptionsQueryOptions(query, nivel, enabled))
}

/**
 * Série mensal do bairro aberto na gaveta.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param neighborhood - Bairro escolhido ou `null` (gaveta fechada).
 * @returns Estado da query do histórico.
 */
export function useRevenueHistoryQuery(query: RevenueQuery, neighborhood: NeighborhoodRef | null) {
  return useQuery(revenueHistoryQueryOptions(query, neighborhood))
}
