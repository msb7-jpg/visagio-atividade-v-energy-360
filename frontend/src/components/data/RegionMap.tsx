import type { KeyboardEvent } from 'react'
import { RMR_MUNICIPALITY_SHAPES, RMR_VIEWBOX } from '@/lib/geo/rmrMunicipalityShapes'
import { cn } from '@/lib/utils'

interface RegionMapProps {
  /** Valor de cada município (nome em caixa alta, como na base); ausente pinta de cinza. */
  values: Record<string, number | undefined>
  /** Classe de preenchimento para o valor do município. */
  fillOf: (value: number) => string
  /** Nome acessível do município com o valor, também mostrado no tooltip nativo. */
  describe: (municipio: string, value: number | undefined) => string
  label: string
  selected?: string
  hovered: string | null
  onHover: (municipio: string | null) => void
  onSelect: (municipio: string) => void
}

/**
 * Mapa da Região Metropolitana do Recife com um polígono por município, pintado pelo valor de cada um.
 * Cada município é um botão: passar o mouse ou focar destaca, clicar ou Enter seleciona.
 *
 * @param props - Valores, escala de cor, descrição, seleção e callbacks.
 * @returns SVG acessível com os 14 municípios.
 */
export function RegionMap({ values, fillOf, describe, label, selected, hovered, onHover, onSelect }: RegionMapProps) {
  const handleKey = (event: KeyboardEvent<SVGPathElement>, municipio: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(municipio)
    }
  }

  return (
    <svg viewBox={RMR_VIEWBOX} role="group" aria-label={label} className="h-auto w-full">
      {RMR_MUNICIPALITY_SHAPES.map(({ municipio, path }) => {
        const value = values[municipio]
        const description = describe(municipio, value)
        const isActive = hovered === municipio || selected === municipio
        return (
          <path
            key={municipio}
            d={path}
            role="button"
            tabIndex={0}
            aria-label={description}
            aria-pressed={selected === municipio}
            className={cn(
              'stroke-card cursor-pointer stroke-1 transition-opacity outline-none focus-visible:stroke-foreground',
              value === undefined ? 'fill-muted' : fillOf(value),
              isActive ? 'stroke-foreground stroke-2' : null,
              hovered && !isActive ? 'opacity-60' : null
            )}
            onMouseEnter={() => onHover(municipio)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(municipio)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(municipio)}
            onKeyDown={(event) => handleKey(event, municipio)}
          >
            <title>{description}</title>
          </path>
        )
      })}
    </svg>
  )
}
