import { describe, expect, it } from 'vitest'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

function unitWithChance(idUc: string, probabilidade_acerto: number) {
  return { id_uc: idUc, probabilidade_acerto, situacao: 'na_fila' } as SuspiciousUnit
}

describe('selectionOutlook', () => {
  it('separa as UCs da seleção entre prioritárias e demais', () => {
    const outlook = selectionOutlook([unitWithChance('A', 0.93), unitWithChance('B', 0.42), unitWithChance('C', 0.07)])

    expect(outlook).toEqual({ selectedCount: 3, priorityCount: 2, otherCount: 1 })
  })

  it('conta como demais as UCs abaixo do corte de prioridade', () => {
    const outlook = selectionOutlook([unitWithChance('A', 0.42), unitWithChance('B', 0.07), unitWithChance('C', 0.07)])

    expect(outlook.otherCount).toBe(2)
  })

  it('zera tudo para uma seleção vazia', () => {
    expect(selectionOutlook([])).toEqual({ selectedCount: 0, priorityCount: 0, otherCount: 0 })
  })
})
