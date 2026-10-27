import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { revenueApi } from '@/features/revenue/api/revenueApi'
import type {
  BreakdownControls,
  BreakdownLevel,
  NeighborhoodRef,
  RevenueQuery
} from '@/features/revenue/types/revenueTypes'
import { toApiParams, toBreakdownParams, toHistoryParams } from '@/features/revenue/utils/revenueFilters'

const revenueKeys = {
  all: ['revenue'] as const,
  kpis: (params: Record<string, string>) => [...revenueKeys.all, 'kpis', params] as const,
  decomposition: (params: Record<string, string>) => [...revenueKeys.all, 'decomposition', params] as const,
  breakdown: (params: Record<string, string | number>) => [...revenueKeys.all, 'breakdown', params] as const,
  history: (params: Record<string, string | number>) => [...revenueKeys.all, 'history', params] as const
}

// Os dados Gold mudam pouco: cache de 5 minutos evita refazer a consulta ao alternar filtros.
const REVENUE_STALE_TIME_MS = 5 * 60 * 1000
// Teto da API; um nível territorial inteiro cabe em uma página para alimentar os filtros.
const OPTIONS_PAGE_SIZE = 100

/**
 * Opções da consulta de indicadores executivos.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param enabled - `false` evita chamar a API enquanto as janelas são inválidas.
 * @returns Opções de query com chave hierárquica e cancelamento via signal.
 */
export function revenueKpisQueryOptions(query: RevenueQuery, enabled = true) {
  return queryOptions({
    queryKey: revenueKeys.kpis(toApiParams(query)),
    queryFn: ({ signal }) => revenueApi.getKpis(query, signal),
    staleTime: REVENUE_STALE_TIME_MS,
    enabled,
    // Mantém os cards na tela enquanto o novo recorte carrega, sem piscar.
    placeholderData: keepPreviousData
  })
}

/**
 * Opções da consulta da decomposição Preço-Volume-Mix.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param enabled - `false` evita chamar a API enquanto as janelas são inválidas.
 * @returns Opções de query da decomposição.
 */
export function revenueDecompositionQueryOptions(query: RevenueQuery, enabled = true) {
  return queryOptions({
    queryKey: revenueKeys.decomposition(toApiParams(query)),
    queryFn: ({ signal }) => revenueApi.getDecomposition(query, signal),
    staleTime: REVENUE_STALE_TIME_MS,
    enabled,
    placeholderData: keepPreviousData
  })
}

/**
 * Opções da consulta do ranking paginado.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param controls - Nível, ordenação e página.
 * @param enabled - `false` evita chamar a API enquanto as janelas são inválidas.
 * @returns Opções de query do ranking.
 */
export function revenueBreakdownQueryOptions(query: RevenueQuery, controls: BreakdownControls, enabled = true) {
  return queryOptions({
    queryKey: revenueKeys.breakdown(toBreakdownParams(query, controls)),
    queryFn: ({ signal }) => revenueApi.getBreakdown(query, controls, signal),
    staleTime: REVENUE_STALE_TIME_MS,
    enabled,
    // Trocar de página ou de ordenação mantém a tabela anterior na tela até a nova chegar.
    placeholderData: keepPreviousData
  })
}

/**
 * Opções que listam os valores existentes de um nível (municípios ou classes) para alimentar os filtros.
 *
 * @param query - Janelas escolhidas; os recortes são ignorados para a lista não encolher ao filtrar.
 * @param nivel - Nível cujos valores populam o seletor.
 * @param enabled - `false` evita chamar a API enquanto as janelas são inválidas.
 * @returns Opções de query reaproveitando o endpoint de ranking.
 */
export function revenueOptionsQueryOptions(query: RevenueQuery, nivel: BreakdownLevel, enabled = true) {
  const windowsOnly: RevenueQuery = { ...query, filters: {} }
  const controls: BreakdownControls = {
    nivel,
    ordenar_por: 'receita_atual_rs',
    ordem: 'desc',
    page: 1,
    page_size: OPTIONS_PAGE_SIZE
  }
  return revenueBreakdownQueryOptions(windowsOnly, controls, enabled)
}

/**
 * Opções da série mensal de um bairro; só dispara quando há bairro escolhido.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param neighborhood - Bairro aberto na gaveta ou `null`.
 * @returns Opções de query do histórico.
 */
export function revenueHistoryQueryOptions(query: RevenueQuery, neighborhood: NeighborhoodRef | null) {
  const target = neighborhood ?? { municipio: '', bairro: '' }
  return queryOptions({
    queryKey: revenueKeys.history(toHistoryParams(query, target)),
    queryFn: ({ signal }) => revenueApi.getHistory(query, target, signal),
    staleTime: REVENUE_STALE_TIME_MS,
    enabled: neighborhood !== null
  })
}
