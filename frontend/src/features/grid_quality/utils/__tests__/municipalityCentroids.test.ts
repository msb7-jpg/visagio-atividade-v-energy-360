import { describe, expect, test } from 'vitest'
import { MUNICIPALITY_SHAPES } from '@/features/grid_quality/utils/municipalityShapes'

type Point = [number, number]

/** Lê um path "M x y L x y ... Z" (pode ter vários subcaminhos) em listas de pontos. */
function parsePolygons(path: string): Point[][] {
  return path
    .split('M')
    .filter((chunk) => chunk.trim() !== '')
    .map((chunk) =>
      chunk
        .replace(/[LZ]/g, ' ')
        .trim()
        .split(/\s+/)
        .reduce<Point[]>((points, token, position, tokens) => {
          if (position % 2 === 0) points.push([Number(token), Number(tokens[position + 1])])
          return points
        }, [])
    )
}

function isInside([pointX, pointY]: Point, polygon: Point[]): boolean {
  let inside = false
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const [currentX, currentY] = polygon[current]
    const [previousX, previousY] = polygon[previous]
    const crosses = currentY > pointY !== previousY > pointY
    if (crosses && pointX < ((previousX - currentX) * (pointY - currentY)) / (previousY - currentY) + currentX) {
      inside = !inside
    }
  }
  return inside
}

describe('centroid dos municípios', () => {
  test.each(MUNICIPALITY_SHAPES.map((shape) => [shape.name, shape] as const))('%s está dentro do contorno', (_, shape) => {
    const polygons = parsePolygons(shape.path)
    expect(polygons.some((polygon) => isInside(shape.centroid, polygon))).toBe(true)
  })
})
