import type { Backtest, BacktestAtSize, BacktestSize } from '@/features/loss_management/types/backtestTypes'

/**
 * Escolhe o tamanho de seleção em exibição.
 *
 * @param sizes - Tamanhos medidos, cada um com os resultados de todos os cortes.
 * @param chosenSize - Tamanho escolhido na tela, ou nulo enquanto ninguém escolheu.
 * @param defaultSize - Tamanho padrão da série.
 * @returns O tamanho escolhido ou, se ele sumiu da série, o padrão; indefinido sem tamanhos medidos.
 */
export function pickSize(
  sizes: BacktestSize[],
  chosenSize: number | null,
  defaultSize: number | null
): BacktestSize | undefined {
  return sizes.find((entry) => entry.tamanho === chosenSize) ?? sizes.find((entry) => entry.tamanho === defaultSize)
}

/**
 * Escolhe o corte em detalhe.
 *
 * @param results - Resultados por corte, do mais antigo ao mais recente.
 * @param chosenCutoff - Corte escolhido na tela, ou nulo enquanto ninguém escolheu.
 * @returns O corte escolhido ou, se ele sumiu da série, o mais antigo; nulo sem cortes.
 */
export function pickCutoff(results: Backtest[], chosenCutoff: string | null): Backtest | null {
  const chosen = chosenCutoff === null ? undefined : results.find((result) => result.data_corte === chosenCutoff)
  return chosen ?? results[0] ?? null
}

/**
 * O resultado de um corte em cada tamanho medido, para comparar os tamanhos no mesmo corte.
 *
 * @param sizes - Tamanhos medidos.
 * @param cutoff - Competência do corte em detalhe.
 * @returns Um item por tamanho que tem esse corte, na ordem dos tamanhos.
 */
export function resultsBySize(sizes: BacktestSize[], cutoff: string | null): BacktestAtSize[] {
  return sizes.flatMap((entry) => {
    const result = entry.cortes.find((cutoffResult) => cutoffResult.data_corte === cutoff)
    return result ? [{ tamanho: entry.tamanho, result }] : []
  })
}
