import type { BreakdownPage } from '@/features/revenue/types/revenueTypes'

/**
 * Extrai e ordena os valores distintos de uma coluna do ranking para alimentar um seletor.
 *
 * @param page - Resposta paginada do ranking no nível desejado (ou `undefined` enquanto carrega).
 * @param column - Coluna que contém os valores (`municipio` ou `classe_consumo`).
 * @returns Lista de textos únicos em ordem alfabética (vazia sem dados).
 */
export function distinctValues(page: BreakdownPage | undefined, column: 'municipio' | 'classe_consumo'): string[] {
  const values = (page?.items ?? []).map((row) => row[column]).filter((text): text is string => Boolean(text))
  return [...new Set(values)].sort((first, second) => first.localeCompare(second, 'pt-BR'))
}
