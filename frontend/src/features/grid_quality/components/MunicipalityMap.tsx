import { RegionMap } from '@/components/data/RegionMap'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'
import { bandOf } from '@/features/grid_quality/utils/continuityBands'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { municipalityKey } from '@/features/grid_quality/utils/municipalityKey'
import { displayName } from '@/lib/geo/placeName'

const describeDec = (decHours: number | undefined) =>
  decHours === undefined ? 'sem dados' : formatDecimal(decHours) + ' h sem energia por cliente'

interface MunicipalityMapProps {
  municipalities: MunicipalityDec[]
  selected?: string
  hovered: string | null
  onHover: (municipio: string | null) => void
  onSelect: (municipio: string) => void
}

/**
 * Mapa da RMR da Continuidade: cada município pintado pela faixa de DEC (verde, azul, âmbar ou vermelho).
 * Passar o mouse ou clicar destaca o município também na lista ao lado.
 *
 * @param props - Municípios com DEC do período, seleção e callbacks.
 * @returns Mapa compartilhado com as cores das faixas de DEC.
 */
export function MunicipalityMap({ municipalities, ...interaction }: MunicipalityMapProps) {
  const values = Object.fromEntries(municipalities.map((municipality) => [municipalityKey(municipality.name), municipality.decHours]))
  const names = new Map(municipalities.map((municipality) => [municipalityKey(municipality.name), municipality.name]))
  return (
    <RegionMap
      {...interaction}
      label="Mapa do DEC por município"
      values={values}
      fillOf={(decHours) => bandOf(decHours).mapFill}
      describe={(municipio, decHours) => `${names.get(municipio) ?? displayName(municipio)}: ${describeDec(decHours)}`}
    />
  )
}
