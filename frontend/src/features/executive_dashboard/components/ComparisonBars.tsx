import { ShareBar } from '@/components/data/ShareBar'
import type { IndicatorUnit } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'

interface ComparisonBarsProps {
  base: number | null
  atual: number | null
  unit: IndicatorUnit
  /** Cor da barra do período atual, pela avaliação do indicador. */
  tone: string
}

const shareOf = (value: number | null, largest: number) => (value === null || largest <= 0 ? 0 : (Math.abs(value) / largest) * 100)

/**
 * Os dois períodos lado a lado em barras na mesma escala (a maior das duas ocupa a largura toda),
 * para o tamanho da mudança aparecer antes de ler o número. A escala começa no zero.
 *
 * @param props - Valores das duas janelas, unidade e cor do período atual.
 * @returns Duas linhas "Antes" e "Agora" com barra e valor.
 */
export function ComparisonBars({ base, atual, unit, tone }: ComparisonBarsProps) {
  const largest = Math.max(Math.abs(base ?? 0), Math.abs(atual ?? 0))
  const rows = [
    { label: 'Antes', value: base, tone: 'bg-chart-4' },
    { label: 'Agora', value: atual, tone }
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="w-10 shrink-0">{row.label}</span>
          <div className="min-w-0 flex-1">
            <ShareBar percent={shareOf(row.value, largest)} tone={row.tone} />
          </div>
          <span className="text-foreground shrink-0 text-right font-medium tabular-nums">
            {formatIndicatorValue(row.value, unit)}
          </span>
        </div>
      ))}
    </div>
  )
}
