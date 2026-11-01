import { ShareBar } from '@/features/grid_quality/components/ShareBar'
import { bandOf } from '@/features/grid_quality/utils/continuityBands'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'

/**
 * Lista de DEC por município, do maior para o menor, com barra proporcional ao maior valor.
 *
 * @param props - Municípios já ordenados por DEC.
 * @returns Lista com nome, barra e valor em horas.
 */
export function MunicipalityDecBars({ municipalities }: { municipalities: MunicipalityDec[] }) {
  const maximum = municipalities[0]?.decHours ?? 0
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground text-sm font-bold">DEC por município (h)</h3>
      <ul className="flex flex-col gap-2">
        {municipalities.map((municipality) => (
          <li key={municipality.name} className="flex items-center gap-3 text-sm">
            <span className="text-foreground w-44 shrink-0">{municipality.name}</span>
            <ShareBar
              percent={maximum === 0 ? 0 : (municipality.decHours / maximum) * 100}
              tone={bandOf(municipality.decHours).swatch}
            />
            <span className="text-foreground w-14 shrink-0 text-right font-bold">{formatDecimal(municipality.decHours)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
