import { describe, expect, test } from 'vitest'
import { MUNICIPALITY_NAMES } from '@/features/grid_quality/utils/continuityMunicipalities'
import { LABEL_GAP, layoutColumn } from '@/features/grid_quality/utils/mapLabelLayout'
import { MUNICIPALITY_SHAPES } from '@/features/grid_quality/utils/municipalityShapes'

describe('layoutColumn', () => {
  test('afasta rótulos de municípios vizinhos sem sair dos limites', () => {
    const heights = layoutColumn(
      [
        { name: 'Olinda', centroidY: 160 },
        { name: 'Paulista', centroidY: 150 },
        { name: 'Recife', centroidY: 470 },
        { name: 'Igarassu', centroidY: 475 }
      ],
      12,
      480
    )

    expect(heights.get('Paulista')).toBe(150)
    expect(heights.get('Olinda')).toBe(150 + LABEL_GAP)
    expect(heights.get('Igarassu')).toBe(480)
    expect(heights.get('Recife')).toBe(480 - LABEL_GAP)
  })

  test('o mapa tem o contorno de todos os municípios do filtro', () => {
    expect(new Set(MUNICIPALITY_SHAPES.map((shape) => shape.name))).toEqual(new Set(MUNICIPALITY_NAMES))
  })
})
