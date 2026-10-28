import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareBar } from '@/features/grid_quality/components/ShareBar'
import { formatPercent, labelOccurrence } from '@/features/grid_quality/utils/continuityFormatters'
import type { TypeShare } from '@/features/grid_quality/types/continuityTypes'

/**
 * Bloco "Por tipo de ocorrência": participação de cada tipo nas ocorrências do período B.
 * Todos os tipos, inclusive oscilação, contam no DEC e no FEC.
 *
 * @param props - Tipos ordenados pela participação.
 * @returns Card com uma barra por tipo.
 */
export function TypeSharesCard({ types }: { types: TypeShare[] }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Por tipo de ocorrência</CardTitle>
        <CardDescription>% das ocorrências do período B.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {types.map((type) => (
            <li key={type.type} className="flex items-center gap-3 text-sm">
              <span className="text-foreground w-44 shrink-0">{labelOccurrence(type.type)}</span>
              <ShareBar percent={type.sharePercent} tone="bg-chart-1" />
              <span className="text-foreground w-16 shrink-0 text-right font-bold">{formatPercent(type.sharePercent)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
