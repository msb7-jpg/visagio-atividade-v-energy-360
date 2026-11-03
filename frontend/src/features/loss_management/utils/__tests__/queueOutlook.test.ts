import { describe, expect, it } from 'vitest'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

function unitWithChance(idUc: string, probabilidade_acerto: number) {
  return { id_uc: idUc, probabilidade_acerto, situacao: 'na_fila' } as SuspiciousUnit
}

describe('selectionOutlook', () => {
  it('soma a chance de acerto de cada UC e arredonda as inspeções esperadas', () => {
    const outlook = selectionOutlook([unitWithChance('A', 0.93), unitWithChance('B', 0.42), unitWithChance('C', 0.07)])

    expect(outlook.selectedCount).toBe(3)
    expect(outlook.expectedHits).toBe(1)
    expect(outlook.expectedMisses).toBe(2)
  })

  it('conta as UCs abaixo do corte de prioridade como baixa chance', () => {
    const outlook = selectionOutlook([unitWithChance('A', 0.42), unitWithChance('B', 0.07), unitWithChance('C', 0.07)])

    expect(outlook.lowChanceCount).toBe(2)
  })

  it('não inventa acertos para uma seleção vazia', () => {
    expect(selectionOutlook([])).toEqual({ selectedCount: 0, expectedHits: 0, expectedMisses: 0, lowChanceCount: 0 })
  })
})
