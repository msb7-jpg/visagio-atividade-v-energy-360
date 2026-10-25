import { BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChartSpec } from '@/features/chat/types/chat.types'

interface InteractiveChartCardProps {
  chart?: ChartSpec | null
}

const WIDTH_STEPS = [
  'w-1/12',
  'w-2/12',
  'w-3/12',
  'w-4/12',
  'w-5/12',
  'w-6/12',
  'w-7/12',
  'w-8/12',
  'w-9/12',
  'w-10/12',
  'w-11/12',
  'w-full'
] as const

function resolveBarWidthClass(rawValue: number, maxVal: number): string {
  const ratio = Math.max(0, Math.min(1, Math.abs(rawValue) / maxVal))
  const bucketIndex = Math.min(
    WIDTH_STEPS.length - 1,
    Math.floor(ratio * WIDTH_STEPS.length)
  )
  return WIDTH_STEPS[bucketIndex]
}

function formatMetricValue(numValue: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numValue)
}

/**
 * Renderizador de gráficos analíticos gerados pelo Agente Text-to-SQL (ChartSpec).
 *
 * @param props - Propriedades contendo a especificação declarativa do gráfico.
 * @returns Card visualizando as categorias e valores proporcionalmente.
 */
export function InteractiveChartCard({ chart }: InteractiveChartCardProps) {
  if (!chart || !chart.data || chart.data.datasets.length === 0) {
    return null
  }

  const primaryDataset = chart.data.datasets[0]
  const labels = chart.data.labels || []
  const values = primaryDataset.data || []
  const maxVal = Math.max(...values.map(val => Math.abs(val)), 1)

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">{chart.title}</h4>
            {chart.description ? (
              <p className="text-xs text-muted-foreground">{chart.description}</p>
            ) : null}
          </div>
        </div>
        <Badge variant="secondary">{chart.chart_type.toUpperCase()}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        {labels.map((label, idx) => {
          const rawValue = values[idx] ?? 0
          const widthClass = resolveBarWidthClass(rawValue, maxVal)

          return (
            <div key={`${label}-${String(idx)}`} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-foreground">{label}</span>
                <span className="font-mono text-muted-foreground">
                  {formatMetricValue(rawValue)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-lg bg-muted">
                <div
                  className={cn(
                    'h-full rounded-lg bg-primary transition-all duration-300',
                    widthClass
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
        <span>Série: {primaryDataset.label}</span>
        <span>{labels.length} categorias</span>
      </div>
    </div>
  )
}
