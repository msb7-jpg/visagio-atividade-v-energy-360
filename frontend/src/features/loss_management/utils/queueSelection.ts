import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

const POSITIVE_INTEGER = /^\d+$/

/** UCs que se marcam por vez: espelha `MAX_SELECTED_UNITS` do backend, acima do qual o resumo da seleção dá 422. */
export const MAX_SELECTION_COUNT = 400

/**
 * Lê o "quantas inspecionar" digitado.
 *
 * @param countText - Texto do campo.
 * @returns O inteiro a partir de 1, ou nulo quando o texto não é um inteiro positivo.
 */
export function parsePositiveInt(countText: string): number | null {
  const trimmedText = countText.trim()
  const count = POSITIVE_INTEGER.test(trimmedText) ? Number(trimmedText) : 0
  return Number.isSafeInteger(count) && count >= 1 ? count : null
}

/**
 * Escolhe as `count` primeiras UCs livres (sem ordem ativa) da fila, na ordem de prioridade.
 *
 * @param units - UCs da fila já carregadas, em ordem de prioridade.
 * @param count - Quantas marcar.
 * @returns Identificadores das UCs a marcar.
 */
export function firstFreeUnitIds(units: SuspiciousUnit[], count: number): string[] {
  return units
    .filter((unit) => unit.situacao === 'na_fila')
    .slice(0, count)
    .map((unit) => unit.id_uc)
}
