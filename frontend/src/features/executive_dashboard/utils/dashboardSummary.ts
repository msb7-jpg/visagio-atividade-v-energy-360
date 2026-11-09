import type {
  Indicator,
  IndicatorEvaluation,
  IndicatorGroup
} from '@/features/executive_dashboard/types/executiveDashboardTypes'

/** Colunas de indicadores que cabem numa linha da grade do Painel em telas largas. */
const ROW_CAPACITY = 4
/** A grade larga tem 12 colunas, divisível por 1, 2, 3 e 4 indicadores por linha. */
const GRID_COLUMNS = 12

/**
 * Conta os indicadores de cada avaliação, sem refazer a avaliação do backend.
 *
 * @param groups - Grupos devolvidos pela API.
 * @returns Quantidade de indicadores por avaliação (zero nas ausentes).
 */
export function countEvaluations(groups: IndicatorGroup[]): Record<IndicatorEvaluation, number> {
  const counts: Record<IndicatorEvaluation, number> = {
    MELHOROU: 0,
    PIOROU: 0,
    ESTAVEL: 0,
    SEM_COMPARACAO: 0,
    INFORMATIVO: 0
  }
  for (const group of groups) {
    for (const indicator of group.indicadores) counts[indicator.avaliacao] += 1
  }
  return counts
}

/**
 * Indicadores com variação relativa, do que mais mudou para o que menos mudou.
 *
 * @param groups - Grupos devolvidos pela API.
 * @returns Indicadores com `variacao_pct` definida, ordenados pelo tamanho da variação.
 */
export function rankedVariations(groups: IndicatorGroup[]): Indicator[] {
  return groups
    .flatMap((group) => group.indicadores)
    .filter((indicator) => indicator.variacao_pct !== null)
    .sort((first, second) => Math.abs(second.variacao_pct ?? 0) - Math.abs(first.variacao_pct ?? 0))
}

/**
 * Indicadores que ficam fora do gráfico de variação por não terem base para comparar.
 *
 * @param groups - Grupos devolvidos pela API.
 * @returns Indicadores com `variacao_pct` nula.
 */
export function indicatorsWithoutVariation(groups: IndicatorGroup[]): Indicator[] {
  return groups.flatMap((group) => group.indicadores).filter((indicator) => indicator.variacao_pct === null)
}

/**
 * Distribui as áreas em linhas de até 4 indicadores e estica cada linha para ocupar a largura toda,
 * para a grade não ficar com buracos quando as áreas têm tamanhos diferentes.
 *
 * @param counts - Quantidade de indicadores de cada área, na ordem da API.
 * @returns Largura de cada área em colunas da grade de 12 e quantos indicadores ela põe lado a lado.
 */
export function packGroupSpans(counts: number[]): { span: number; columns: number }[] {
  const rows: number[][] = [[]]
  for (const count of counts) {
    const columns = Math.min(Math.max(count, 1), ROW_CAPACITY)
    const row = rows[rows.length - 1]
    if (row.reduce((total, used) => total + used, 0) + columns > ROW_CAPACITY) {
      rows.push([columns])
    } else {
      row.push(columns)
    }
  }
  return rows.flatMap((row) => {
    const rowTotal = row.reduce((total, used) => total + used, 0)
    return row.map((columns) => ({ span: (columns * GRID_COLUMNS) / rowTotal, columns }))
  })
}

/**
 * Junta os números de todos os indicadores num mapa plano para o resumo da IA.
 *
 * @param groups - Grupos devolvidos pela API, ou `undefined` enquanto carregam.
 * @returns Mapa `<id>_atual`, `<id>_base`, `<id>_var_pct` e `<id>_var_pp`, ou `undefined` sem dados.
 */
export function extractMetricsFromGroups(groups?: IndicatorGroup[]): Record<string, string | number> | undefined {
  if (!groups) return undefined
  const metricMap: Record<string, string | number> = {}
  for (const indicator of groups.flatMap((group) => group.indicadores)) {
    if (indicator.atual !== null) metricMap[`${indicator.id}_atual`] = indicator.atual
    if (indicator.base !== null) metricMap[`${indicator.id}_base`] = indicator.base
    if (indicator.variacao_pct !== null) metricMap[`${indicator.id}_var_pct`] = indicator.variacao_pct
    if (indicator.variacao_pp !== null) metricMap[`${indicator.id}_var_pp`] = indicator.variacao_pp
  }
  return metricMap
}
