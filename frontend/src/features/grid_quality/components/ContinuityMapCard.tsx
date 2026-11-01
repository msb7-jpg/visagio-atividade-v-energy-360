import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MunicipalityDecBars } from '@/features/grid_quality/components/MunicipalityDecBars'
import { MunicipalityMap } from '@/features/grid_quality/components/MunicipalityMap'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'
import type { PeriodLabels } from '@/features/grid_quality/utils/periodLabels'

/**
 * Bloco "Onde estão as piores interrupções": mapa dos municípios e DEC por município.
 *
 * @param props - Municípios com DEC do período B e os textos dos períodos.
 * @returns Card com o mapa à esquerda e a lista à direita.
 */
export function ContinuityMapCard({ municipalities, periods }: { municipalities: MunicipalityDec[]; periods: PeriodLabels }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Onde estão as piores interrupções</CardTitle>
        <CardDescription>Horas sem energia por cliente (DEC) em cada município, de {periods.current}. A cor mostra a faixa de DEC.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <MunicipalityMap municipalities={municipalities} />
        <MunicipalityDecBars municipalities={municipalities} />
      </CardContent>
    </Card>
  )
}
