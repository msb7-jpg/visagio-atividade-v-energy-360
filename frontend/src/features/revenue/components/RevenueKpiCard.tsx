import { useId } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import { VariationBadge } from '@/features/revenue/components/VariationBadge'
import type { KpiValue } from '@/features/revenue/types/revenueTypes'

interface RevenueKpiCardProps {
  title: string
  formula: string
  icon: LucideIcon
  kpi: KpiValue
  format: (value: number | null) => string
  detail: string
}

/**
 * Card de um indicador: valor atual em destaque, variação contra a janela base e a referência da base.
 * O título explica a fórmula no tooltip, que abre com mouse, foco do teclado ou toque, e também é lida por leitores de tela.
 *
 * @param props - Título, fórmula, ícone, indicador, formatador do valor e linha de apoio.
 * @returns Card interativo no padrão da Receita 1 do design.md.
 */
export function RevenueKpiCard({ title, formula, icon: Icon, kpi, format, detail }: RevenueKpiCardProps) {
  const formulaId = useId()
  return (
    <Card variant="interactive" role="group" aria-label={title}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Tooltip content={formula}>
          <div
            tabIndex={0}
            aria-describedby={formulaId}
            className="focus-visible:ring-ring cursor-help rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <CardTitle>{title}</CardTitle>
          </div>
          <span id={formulaId} className="sr-only">{formula}</span>
        </Tooltip>
        <div className="bg-primary/10 text-primary rounded-lg p-1.5">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold tracking-tight">{format(kpi.atual)}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <VariationBadge variation={kpi.variacao_pct} />
          <CardDescription>{detail}</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
