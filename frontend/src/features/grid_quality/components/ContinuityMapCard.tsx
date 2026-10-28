import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MunicipalityDecBars } from '@/features/grid_quality/components/MunicipalityDecBars'
import { MunicipalityMap } from '@/features/grid_quality/components/MunicipalityMap'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'

/**
 * Bloco "Onde estão as piores interrupções": mapa esquemático e DEC por município.
 *
 * @param props - Municípios com DEC do período B.
 * @returns Card com o mapa à esquerda e a lista à direita.
 */
export function ContinuityMapCard({ municipalities }: { municipalities: MunicipalityDec[] }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Onde estão as piores interrupções</CardTitle>
        <CardDescription>DEC do período B por município; círculos coloridos pela faixa de DEC.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <MunicipalityMap municipalities={municipalities} />
        <MunicipalityDecBars municipalities={municipalities} />
      </CardContent>
    </Card>
  )
}
