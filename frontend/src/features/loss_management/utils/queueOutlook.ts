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
