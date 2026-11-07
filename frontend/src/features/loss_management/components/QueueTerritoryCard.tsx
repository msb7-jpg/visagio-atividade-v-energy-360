import { useState } from 'react'
import { RegionMap } from '@/components/data/RegionMap'
import { Button } from '@/components/ui/button'
import { ShareBar } from '@/components/data/ShareBar'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'
import { displayName } from '@/lib/geo/placeName'
import { cn } from '@/lib/utils'

const SHADES = ['fill-warning/20', 'fill-warning/40', 'fill-warning/65', 'fill-warning/90']
const LIST_SIZE = 8

interface QueueTerritoryCardProps {
  /** UCs suspeitas por município, da fila inteira (não só das carregadas). */
  counts: Record<string, number>
  selected?: string
  onSelect: (municipio: string | undefined) => void
}

/**
 * Onde estão as UCs suspeitas: mapa da RMR mais escuro onde há mais UCs e os municípios com mais suspeitas.
 * Clicar num município aplica o filtro de município da fila; clicar de novo remove.
 *
 * @param props - Contagem por município, município filtrado e callback de filtro.
 * @returns Bloco com o mapa e a lista dos municípios com mais UCs.
 */
export function QueueTerritoryCard({ counts, selected, onSelect }: QueueTerritoryCardProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const maximum = Math.max(1, ...Object.values(counts))
  const ranked = Object.entries(counts).sort(([, left], [, right]) => right - left).slice(0, LIST_SIZE)
  const toggle = (municipio: string) => onSelect(selected === municipio ? undefined : municipio)
  const fillOf = (value: number) => SHADES[Math.min(SHADES.length - 1, Math.floor((value / maximum) * SHADES.length))]

  return (
    <section aria-labelledby="fila-territorio" className="bg-card border-border flex gap-6 rounded-md border p-4">
      <div className="w-28 shrink-0">
        <RegionMap
          label="Mapa das UCs suspeitas por município"
          values={counts}
          fillOf={fillOf}
          describe={(municipio, value) => `${displayName(municipio)}: ${formatInteger(value ?? 0)} UCs suspeitas`}
          selected={selected}
          hovered={hovered}
          onHover={setHovered}
          onSelect={toggle}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 id="fila-territorio" className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Onde estão as suspeitas
        </h2>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {ranked.map(([municipio, count]) => (
            <li
              key={municipio}
              className={cn('flex flex-col gap-1 rounded-sm px-2 py-1', hovered === municipio || selected === municipio ? 'bg-muted' : null)}
              onMouseEnter={() => setHovered(municipio)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <Button variant="inline" size="inline" aria-pressed={selected === municipio} onClick={() => toggle(municipio)}>
                  {displayName(municipio)}
                </Button>
                <span className="text-foreground font-medium tabular-nums">{formatInteger(count)}</span>
              </span>
              <ShareBar percent={(count / maximum) * 100} tone="bg-warning" />
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground mt-auto text-xs">Clique num município para filtrar a fila.</p>
      </div>
    </section>
  )
}
