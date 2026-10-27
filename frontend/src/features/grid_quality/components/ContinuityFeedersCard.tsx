import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeederUcHoursTable } from '@/features/grid_quality/components/FeederUcHoursTable'
import type { FeederUcHours } from '@/features/grid_quality/types/continuityTypes'

/**
 * Bloco "Alimentadores por UC-horas" do período B.
 *
 * @param props - Alimentadores ordenados por UC-horas.
 * @returns Card com a tabela e a nota sobre o cálculo.
 */
export function ContinuityFeedersCard({ feeders }: { feeders: FeederUcHours[] }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Alimentadores por UC-horas</CardTitle>
        <CardDescription>
          UC-horas = DEC do mês × UCs atendidas, somado no período B. Amostra pequena: menos de 50 UCs atendidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeederUcHoursTable feeders={feeders} />
      </CardContent>
    </Card>
  )
}
