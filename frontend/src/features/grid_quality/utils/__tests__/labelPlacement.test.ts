import { describe, expect, test } from 'vitest'
import { MUNICIPALITY_NAMES } from '@/features/grid_quality/utils/continuityMunicipalities'
import { LABEL_SIDES, labelPlacement } from '@/features/grid_quality/utils/labelPlacement'

describe('labelPlacement', () => {
  test.each(MUNICIPALITY_NAMES)('%s tem lado definido', (name) => {
    expect(LABEL_SIDES[name]).toBeDefined()
  })

  test('os 14 municípios têm entrada e nenhuma sobra', () => {
    expect(Object.keys(LABEL_SIDES).sort((first, second) => first.localeCompare(second))).toEqual([...MUNICIPALITY_NAMES].sort((first, second) => first.localeCompare(second)))
  })

  test('esquerda e direita afastam o texto e ancoram no lado certo', () => {
    expect(labelPlacement('Abreu e Lima', 5)).toMatchObject({ dx: -9, anchor: 'end' })
    expect(labelPlacement('Igarassu', 5)).toMatchObject({ dx: 9, anchor: 'start' })
  })

  test('cima e baixo ficam centralizados', () => {
    expect(labelPlacement('Ipojuca', 5)).toEqual({ dx: 0, dy: -9, anchor: 'middle' })
    expect(labelPlacement('Recife', 5).dy).toBeGreaterThan(0)
  })

  test('nome desconhecido cai em cima', () => {
    expect(labelPlacement('Outro', 5).anchor).toBe('middle')
  })
})
