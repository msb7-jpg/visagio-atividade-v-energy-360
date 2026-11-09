import { Tooltip } from '@/components/ui/tooltip-card'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorChange } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATIONS } from '@/features/executive_dashboard/utils/indicatorTrend'
import { cn } from '@/lib/utils'

function describe(indicator: Indicator): string {
  const change = indicator.variacao_pct === null && indicator.variacao_pp === null
    ? ''
    : ` (${formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)})`
  return `${indicator.titulo}: ${EVALUATIONS[indicator.avaliacao].label.toLowerCase()}${change}`
}

function IndicatorPill({ indicator }: { indicator: Indicator }) {
  const evaluation = EVALUATIONS[indicator.avaliacao]
  return (
    <Tooltip
      content={(
        <span className="flex flex-col">
          <span className="font-medium">{indicator.titulo}</span>
          <span className={evaluation.textColor}>
            {evaluation.label}
            {indicator.variacao_pct === null ? '' : ` · ${formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)}`}
          </span>
        </span>
      )}
    >
      <span className={cn('block h-2.5 w-8 rounded-sm', evaluation.barColor)} aria-hidden="true" />
    </Tooltip>
  )
}

/**
 * Situação de cada área numa linha: uma pastilha por indicador, na cor da avaliação, e o nome da área
 * levando ao bloco dela mais abaixo. O texto de cada pastilha fica no tooltip e para leitores de tela.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Lista de áreas com as pastilhas dos indicadores.
 */
export function AreaHealthList({ groups }: { groups: IndicatorGroup[] }) {
  return (
    <div className="border-border flex flex-1 flex-col gap-2 border-t pt-4">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Por área</h3>
      <ul className="divide-border flex flex-1 flex-col justify-evenly divide-y">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center justify-between gap-3 py-2">
            <a href={`#grupo-${group.id}`} className="text-foreground text-sm font-medium underline-offset-4 hover:underline">
              {group.titulo}
            </a>
            <span className="flex items-center gap-1">
              {group.indicadores.map((indicator) => <IndicatorPill key={indicator.id} indicator={indicator} />)}
            </span>
            <span className="sr-only">{group.indicadores.map(describe).join('; ')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
