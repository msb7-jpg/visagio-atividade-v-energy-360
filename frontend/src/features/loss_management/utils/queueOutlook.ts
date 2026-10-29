import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { isPriorityUnit } from '@/features/loss_management/utils/queueBands'

export interface SelectionOutlook {
  selectedCount: number
  /** Inspeções que, pelo histórico, devem achar irregularidade (soma das chances, arredondada). */
  expectedHits: number
  /** Inspeções que, pelo histórico, devem voltar sem achado: dias de equipe sem retorno. */
  expectedMisses: number
  /** UCs selecionadas abaixo do corte de chance da faixa prioritária. */
  lowChanceCount: number
}

export interface CapacityGap {
  priorityCount: number
  lowChanceCount: number
  /** Melhor chance de acerto entre as UCs de baixa chance. */
  lowChanceMaxRate: number
  capacity: number
}

/**
 * Estima quantas inspeções da seleção devem achar irregularidade, somando a chance de acerto de cada UC.
 *
 * @param selectedUnits - UCs marcadas para gerar ordem.
 * @returns Acertos e perdas esperados e quantas UCs são de baixa chance.
 */
export function selectionOutlook(selectedUnits: SuspiciousUnit[]): SelectionOutlook {
  const expectedHitsExact = selectedUnits.reduce((total, unit) => total + unit.probabilidade_acerto, 0)
  const expectedHits = Math.round(expectedHitsExact)
  return {
    selectedCount: selectedUnits.length,
    expectedHits,
    expectedMisses: selectedUnits.length - expectedHits,
    lowChanceCount: selectedUnits.filter((unit) => !isPriorityUnit(unit)).length
  }
}

/**
 * Compara as UCs prioritárias livres com a capacidade mensal da equipe.
 *
 * @param units - UCs da fila.
 * @param capacity - Inspeções que a equipe faz por mês.
 * @returns A lacuna quando as prioritárias não enchem a capacidade; null quando enchem ou não há UC livre.
 */
export function describeCapacityGap(units: SuspiciousUnit[], capacity: number): CapacityGap | null {
  const freeUnits = units.filter((unit) => unit.situacao === 'na_fila')
  const priorityCount = freeUnits.filter(isPriorityUnit).length
  if (freeUnits.length === 0 || priorityCount >= capacity) return null
  const lowChanceRates = freeUnits.filter((unit) => !isPriorityUnit(unit)).map((unit) => unit.probabilidade_acerto)
  return {
    priorityCount,
    lowChanceCount: lowChanceRates.length,
    lowChanceMaxRate: Math.max(0, ...lowChanceRates),
    capacity
  }
}
