import { describe, expect, it } from 'vitest'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { describeCapacityGap, selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

function unitWithChance(idUc: string, probabilidade_acerto: number, situacao: SuspiciousUnit['situacao'] = 'na_fila') {
  return { id_uc: idUc, probabilidade_acerto, situacao } as SuspiciousUnit
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

describe('describeCapacityGap', () => {
  const units = [
    unitWithChance('A', 0.42),
    unitWithChance('B', 0.42),
    unitWithChance('C', 0.07),
    unitWithChance('D', 0.07),
    unitWithChance('E', 0.07, 'ordem_gerada')
  ]

  it('compara as prioritárias livres com a capacidade e traz a melhor chance das demais', () => {
    expect(describeCapacityGap(units, 200)).toEqual({ priorityCount: 2, lowChanceCount: 2, lowChanceMaxRate: 0.07, capacity: 200 })
  })

  it('não mostra nada quando as prioritárias já enchem a capacidade', () => {
    expect(describeCapacityGap([unitWithChance('A', 0.9), unitWithChance('B', 0.9)], 2)).toBeNull()
  })

  it('não mostra nada sem UC livre na fila', () => {
    expect(describeCapacityGap([unitWithChance('A', 0.9, 'em_campo')], 200)).toBeNull()
  })
})
