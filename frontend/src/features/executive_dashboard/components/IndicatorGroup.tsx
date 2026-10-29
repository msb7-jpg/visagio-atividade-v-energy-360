import { IndicatorCard } from '@/features/executive_dashboard/components/IndicatorCard'
import type { IndicatorGroup as IndicatorGroupData } from '@/features/executive_dashboard/types/executiveDashboardTypes'

/**
 * Bloco de uma área do negócio com um card por indicador.
 *
 * @param props - Grupo devolvido pela API.
 * @returns Seção com título e grade de cards.
 */
export function IndicatorGroup({ group }: { group: IndicatorGroupData }) {
  const headingId = `grupo-${group.id}`
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-foreground text-lg font-semibold">{group.titulo}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {group.indicadores.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </section>
  )
}
