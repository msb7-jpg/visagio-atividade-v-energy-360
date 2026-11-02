import { describe, expect, test } from 'vitest'
import { MUNICIPALITY_NAMES } from '@/features/grid_quality/utils/continuityMunicipalities'
import { LABEL_GAP, layoutColumn } from '@/features/grid_quality/utils/mapLabelLayout'
import { MAP_HEIGHT, MUNICIPALITY_SHAPES } from '@/features/grid_quality/utils/municipalityShapes'

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

describe('rótulos do mapa com os contornos reais', () => {
  test.each(['left', 'right'] as const)('coluna %s respeita LABEL_GAP e os limites do mapa', (side) => {
    // Limites iguais aos de MunicipalityMap: LABEL_MARGIN (12) no topo e MAP_HEIGHT - LINE_HEIGHT (13) embaixo.
    const top = 12
    const bottom = MAP_HEIGHT - 13
    const anchors = MUNICIPALITY_SHAPES.filter((shape) => shape.side === side).map((shape) => ({
      name: shape.name,
      centroidY: shape.centroid[1]
    }))
    const heights = [...layoutColumn(anchors, top, bottom).values()].sort((first, second) => first - second)
    expect(heights).toHaveLength(anchors.length)
    expect(heights[0]).toBeGreaterThanOrEqual(top)
    expect(heights[heights.length - 1]).toBeLessThanOrEqual(bottom)
    heights.slice(1).forEach((height, position) => expect(height - heights[position]).toBeGreaterThanOrEqual(LABEL_GAP))
  })

  test('Abreu e Lima fica na coluna esquerda', () => {
    expect(MUNICIPALITY_SHAPES.find((shape) => shape.name === 'Abreu e Lima')?.side).toBe('left')
  })
})
