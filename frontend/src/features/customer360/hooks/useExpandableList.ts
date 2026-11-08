import { useState } from 'react'

interface ExpandableList<Item> {
  visible: Item[]
  hiddenCount: number
  expanded: boolean
  toggle: () => void
}

/**
 * Mostra só os primeiros itens de uma lista já ordenada (os mais recentes) e deixa expandir o resto no próprio bloco.
 *
 * @param items - Lista completa, da mais recente para a mais antiga.
 * @param limit - Quantos itens aparecem antes de expandir.
 * @returns Itens visíveis, quantos ficam escondidos, se está expandida e a troca de estado.
 */
export function useExpandableList<Item>(items: Item[], limit: number): ExpandableList<Item> {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, limit)
  return { visible, hiddenCount: items.length - visible.length, expanded, toggle: () => setExpanded((current) => !current) }
}
