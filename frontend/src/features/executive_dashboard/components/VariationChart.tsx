import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { indicatorsWithoutVariation, rankedVariations } from '@/features/executive_dashboard/utils/dashboardSummary'
import { formatIndicatorChange, formatIndicatorValue, formatVariation } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATION_ORDER, EVALUATIONS } from '@/features/executive_dashboard/utils/indicatorTrend'
import { cn } from '@/lib/utils'

/** Barra visível mesmo nas variações muito pequenas, sem esconder que são pequenas. */
const MIN_BAR_PERCENT = 1.5

function RowTooltip({ indicator }: { indicator: Indicator }) {
  const evaluation = EVALUATIONS[indicator.avaliacao]
  return (
    <span className="flex flex-col gap-0.5">
      <span className="font-medium">{indicator.titulo}</span>
      <span className="text-muted-foreground">
        {formatIndicatorValue(indicator.base, indicator.unidade)} → {formatIndicatorValue(indicator.atual, indicator.unidade)}
      </span>
      <span className={evaluation.textColor}>
        {evaluation.label} · {formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)}
      </span>
    </span>
  )
}

function VariationRow({ indicator, scale }: { indicator: Indicator; scale: number }) {
  const change = indicator.variacao_pct ?? 0
  const isDrop = change < 0
  const bar = (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'h-3 w-(--bar-width)',
        EVALUATIONS[indicator.avaliacao].barColor,
        isDrop ? 'origin-right rounded-l-sm' : 'origin-left rounded-r-sm'
      )}
      style={{ '--bar-width': `${Math.max((Math.abs(change) / scale) * 100, MIN_BAR_PERCENT)}%` } as CSSProperties}
    />
  )
  return (
    <li data-testid={`variation-${indicator.id}`}>
      <Tooltip containerClassName="block w-full" content={<RowTooltip indicator={indicator} />}>
        <div className="hover:bg-muted grid grid-cols-12 items-center gap-x-3 gap-y-1 rounded-sm px-2 py-1.5">
          <span className="text-foreground col-span-8 truncate text-sm sm:col-span-4">{indicator.titulo}</span>
          <span className="col-span-4 text-right text-sm font-semibold tabular-nums sm:order-last sm:col-span-2">
            {formatVariation(indicator.variacao_pct)}
            <span className="sr-only">, {EVALUATIONS[indicator.avaliacao].label}</span>
          </span>
          <div aria-hidden="true" className="col-span-12 grid h-5 grid-cols-2 sm:col-span-6">
            <div className="flex items-center justify-end">{isDrop ? bar : null}</div>
            <div className="border-input flex items-center border-l">{isDrop ? null : bar}</div>
          </div>
        </div>
      </Tooltip>
    </li>
  )
}

/**
 * "Maiores variações": a variação de cada indicador frente ao período base em barras divergentes a partir
 * do zero, da maior para a menor. A cor é a avaliação do backend (subir pode ser bom ou ruim); o lado da
 * barra é só o sentido do número. Todas as barras usam a mesma escala.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Card com o gráfico, a legenda e os indicadores sem base para comparar.
 */
export function VariationChart({ groups }: { groups: IndicatorGroup[] }) {
  const ranked = rankedVariations(groups)
  const missing = indicatorsWithoutVariation(groups)
  const scale = Math.max(...ranked.map((indicator) => Math.abs(indicator.variacao_pct ?? 0)), 1)
  const shown = EVALUATION_ORDER.filter((status) => ranked.some((indicator) => indicator.avaliacao === status))

  return (
    <Card data-testid="dashboard-variations" className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Maiores variações</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="text-muted-foreground grid grid-cols-12 gap-x-3 px-2 text-xs">
          <div className="col-span-12 grid grid-cols-2 sm:col-span-6 sm:col-start-5">
            <span className="pr-2 text-right">← Queda</span>
            <span className="pl-2">Alta →</span>
          </div>
        </div>
        <ul className="flex flex-col">
          {ranked.map((indicator) => <VariationRow key={indicator.id} indicator={indicator} scale={scale} />)}
        </ul>
        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs">
          {shown.map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('size-2.5 rounded-sm', EVALUATIONS[status].barColor)} />
              {EVALUATIONS[status].label}
            </span>
          ))}
          {missing.length > 0 ? (
            <span>Sem base de comparação: {missing.map((indicator) => indicator.titulo).join(', ')}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
