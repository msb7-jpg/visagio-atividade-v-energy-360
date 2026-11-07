import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MunicipalityDecBars } from '@/features/grid_quality/components/MunicipalityDecBars'
import { MunicipalityMap } from '@/features/grid_quality/components/MunicipalityMap'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'
import { DEC_BANDS } from '@/features/grid_quality/utils/continuityBands'
import type { PeriodLabels } from '@/features/grid_quality/utils/periodLabels'

function BandLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
      {DEC_BANDS.map((band) => (
        <span key={band.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`${band.swatch} size-3 rounded-sm`} />
          {band.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Bloco "Onde estão as piores interrupções": mapa da RMR pintado pela faixa de DEC e a lista de municípios ao lado,
 * no mesmo formato do mapa da Inteligência Comercial. Passar o mouse destaca o município nos dois; clicar fixa o destaque.
 *
 * @param props - Municípios com DEC do período B e os textos dos períodos.
 * @returns Card com o mapa, a legenda das faixas e a lista.
 */
export function ContinuityMapCard({ municipalities, periods }: { municipalities: MunicipalityDec[]; periods: PeriodLabels }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const toggle = (municipio: string) => setSelected(selected === municipio ? undefined : municipio)
  const shared = { municipalities, selected, hovered, onHover: setHovered, onSelect: toggle }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Onde estão as piores interrupções</CardTitle>
        <CardDescription>Horas sem energia por cliente (DEC) em cada município, de {periods.current}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <div className="mx-auto flex w-full max-w-64 flex-col gap-3 lg:col-span-2">
            <MunicipalityMap {...shared} />
            <BandLegend />
          </div>
          <div className="lg:col-span-3">
            <MunicipalityDecBars {...shared} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
