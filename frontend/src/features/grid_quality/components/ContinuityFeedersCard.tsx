import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeederUcHoursTable } from '@/features/grid_quality/components/FeederUcHoursTable'
import type { FeederUcHours } from '@/features/grid_quality/types/continuityTypes'
import type { PeriodLabels } from '@/features/grid_quality/utils/periodLabels'

/**
 * Bloco "Alimentadores por UC-horas" do período B.
 *
 * @param props - Alimentadores ordenados por UC-horas e os textos dos períodos.
 * @returns Card com a tabela e a nota sobre o cálculo.
 */
export function ContinuityFeedersCard({ feeders, periods }: { feeders: FeederUcHours[]; periods: PeriodLabels }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Alimentadores por UC-horas</CardTitle>
        <CardDescription>
          UC-horas = soma das horas sem energia de cada UC interrompida de {periods.current}; os 20 maiores. Amostra pequena: menos de 50 UCs atendidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeederUcHoursTable feeders={feeders} periods={periods} />
      </CardContent>
    </Card>
  )
}
