import type { CSSProperties } from 'react'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { formatCompactCurrency } from '@/features/revenue/utils/revenueFormatters'
import { formatMonth } from '@/lib/periods/periodPresets'

const MONTHS = 12

/**
 * Receita dos últimos 12 meses em barras pequenas, para ver a tendência do bairro sem abrir nada.
 * Cada barra mostra o mês e o valor ao passar o mouse.
 *
 * @param props - Pontos mensais do bairro (os 12 mais recentes são usados).
 * @returns Barras com altura proporcional ao maior mês, ou um traço enquanto a série carrega.
 */
export function MonthlySparkline({ points }: { points: MonthlyPoint[] | undefined }) {
  if (!points) return <span className="text-muted-foreground text-xs">…</span>
  const recent = points.slice(-MONTHS)
  const maximum = Math.max(1, ...recent.map((point) => point.receita_rs))
  const description = recent.map((point) => `${formatMonth(point.competencia)}: ${formatCompactCurrency(point.receita_rs)}`).join(', ')
  return (
    <div role="img" aria-label={`Receita mensal: ${description}`} className="flex h-8 w-24 items-end gap-0.5">
      {recent.map((point) => (
        <div
          key={point.competencia}
          title={`${formatMonth(point.competencia)}: ${formatCompactCurrency(point.receita_rs)}`}
          className="bg-primary/70 hover:bg-primary h-(--bar-height) min-h-px flex-1 rounded-t-sm"
          style={{ '--bar-height': `${(point.receita_rs / maximum) * 100}%` } as CSSProperties}
        />
      ))}
    </div>
  )
}
