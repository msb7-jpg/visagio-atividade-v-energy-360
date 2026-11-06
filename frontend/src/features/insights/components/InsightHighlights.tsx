import type { InsightHighlight } from '@/features/insights/api/insightsApi'
import { formatHighlight } from '@/features/insights/utils/formatHighlight'

/**
 * Números de destaque do insight, lado a lado com a manchete: o rótulo curto e o valor grande.
 *
 * @param props - Destaques devolvidos pela API (até três).
 * @returns Lista de definições, ou nada quando a IA não destacou números.
 */
export function InsightHighlights({ highlights }: { highlights: InsightHighlight[] }) {
  if (highlights.length === 0) return null
  return (
    <dl className="grid grid-cols-1 content-start gap-3 sm:grid-cols-3 lg:col-span-3">
      {highlights.map((highlight) => (
        <div key={highlight.metrica} className="bg-card border-primary/15 flex min-w-0 flex-col gap-1 rounded-md border p-3">
          <dt className="text-muted-foreground truncate text-xs font-medium">{highlight.rotulo}</dt>
          <dd className="text-foreground text-2xl font-semibold tabular-nums">{formatHighlight(highlight)}</dd>
        </div>
      ))}
    </dl>
  )
}
