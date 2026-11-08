import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { isPriorityUnit } from '@/features/loss_management/utils/queueBands'

export interface SelectionOutlook {
  selectedCount: number
  /** UCs selecionadas na faixa prioritária. */
  priorityCount: number
  /** UCs selecionadas fora da faixa prioritária. */
  otherCount: number
}

/**
 * Conta quantas UCs da seleção estão na faixa prioritária e quantas ficaram fora dela.
 *
 * @param selectedUnits - UCs marcadas para gerar ordem.
 * @returns Total selecionado, prioritárias e demais.
 */
export function selectionOutlook(selectedUnits: SuspiciousUnit[]): SelectionOutlook {
  const priorityCount = selectedUnits.filter(isPriorityUnit).length
  return {
    selectedCount: selectedUnits.length,
    priorityCount,
    otherCount: selectedUnits.length - priorityCount
  }
}
