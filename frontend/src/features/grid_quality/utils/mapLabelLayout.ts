/** Distância vertical mínima entre dois rótulos da mesma coluna (nome e DEC ocupam duas linhas). */
export const LABEL_GAP = 30

export interface LabelAnchor {
  name: string
  centroidY: number
}

/**
 * Altura de cada rótulo numa coluna, o mais perto possível do município e sem sobrepor o vizinho.
 *
 * Desce a partir do norte respeitando o espaçamento; se o último passar do limite, sobe os anteriores.
 *
 * @param anchors - Municípios da coluna, com a altura do centro de cada um.
 * @param top - Altura mínima do primeiro rótulo.
 * @param bottom - Altura máxima do último rótulo.
 * @returns Altura do rótulo por município.
 */
export function layoutColumn(anchors: LabelAnchor[], top: number, bottom: number): Map<string, number> {
  const sorted = [...anchors].sort((first, second) => first.centroidY - second.centroidY)
  const heights = sorted.map((anchor) => anchor.centroidY)
  heights.forEach((height, position) => {
    const floor = position === 0 ? top : heights[position - 1] + LABEL_GAP
    heights[position] = Math.max(height, floor)
  })
  for (let position = heights.length - 1; position >= 0; position -= 1) {
    const ceiling = position === heights.length - 1 ? bottom : heights[position + 1] - LABEL_GAP
    heights[position] = Math.min(heights[position], ceiling)
  }
  return new Map(sorted.map((anchor, position) => [anchor.name, heights[position]]))
}
