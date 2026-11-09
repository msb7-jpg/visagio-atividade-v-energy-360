import { Button } from '@/components/ui/button'

interface ShowMoreButtonProps {
  hiddenCount: number
  expanded: boolean
  onToggle: () => void
}

/**
 * Botão "Ver todos" que expande a lista no próprio bloco e "Mostrar menos" para recolher.
 *
 * @param props - Quantos itens estão escondidos, se a lista está expandida e a troca de estado.
 * @returns Botão de texto, ou nada quando a lista inteira já cabe.
 */
export function ShowMoreButton({ hiddenCount, expanded, onToggle }: ShowMoreButtonProps) {
  if (hiddenCount === 0 && !expanded) return null
  return (
    <Button variant="link" size="inline" onClick={onToggle} aria-expanded={expanded}>
      {expanded ? 'Mostrar menos' : `Ver todos (mais ${hiddenCount})`}
    </Button>
  )
}
