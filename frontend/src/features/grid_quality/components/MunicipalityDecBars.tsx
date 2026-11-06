import { ShareBar } from '@/components/data/ShareBar'
import { Button } from '@/components/ui/button'
import { municipalityKey } from '@/features/grid_quality/utils/municipalityKey'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'
import { bandOf } from '@/features/grid_quality/utils/continuityBands'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { cn } from '@/lib/utils'

interface MunicipalityDecBarsProps {
  municipalities: MunicipalityDec[]
  selected?: string
  hovered: string | null
  onHover: (municipio: string | null) => void
  onSelect: (municipio: string) => void
}

/**
 * DEC por município, do maior para o menor, com a barra na cor da faixa e o mesmo destaque do mapa ao lado.
 *
 * @param props - Municípios já ordenados por DEC, seleção e callbacks.
 * @returns Lista ordenada com nome, barra e horas.
 */
export function MunicipalityDecBars({ municipalities, selected, hovered, onHover, onSelect }: MunicipalityDecBarsProps) {
  const maximum = municipalities[0]?.decHours ?? 0
  return (
    <ol className="flex flex-col" aria-label="DEC por município">
      {municipalities.map((municipality) => {
        const key = municipalityKey(municipality.name)
        const isActive = hovered === key || selected === key
        return (
          <li
            key={municipality.name}
            className={cn('grid grid-cols-5 items-center gap-3 rounded-sm px-2 py-1.5', isActive ? 'bg-muted' : null)}
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
          >
            <span className="col-span-2 min-w-0 truncate text-sm">
              <Button variant="inline" size="inline" aria-pressed={selected === key} onClick={() => onSelect(key)}>
                {municipality.name}
              </Button>
            </span>
            <span className="col-span-2">
              <ShareBar
                percent={maximum === 0 ? 0 : (municipality.decHours / maximum) * 100}
                tone={bandOf(municipality.decHours).swatch}
              />
            </span>
            <span className="text-foreground text-right text-sm font-medium tabular-nums">{formatDecimal(municipality.decHours)} h</span>
          </li>
        )
      })}
    </ol>
  )
}
