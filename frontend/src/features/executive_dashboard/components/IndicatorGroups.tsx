import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import { ComparisonBars } from '@/features/executive_dashboard/components/ComparisonBars'
import { GroupHeading } from '@/features/executive_dashboard/components/GroupHeading'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { packGroupSpans } from '@/features/executive_dashboard/utils/dashboardSummary'
import { formatIndicatorChange, formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATIONS, variationArrow } from '@/features/executive_dashboard/utils/indicatorTrend'
import { cn } from '@/lib/utils'

function IndicatorTile({ indicator }: { indicator: Indicator }) {
  const evaluation = EVALUATIONS[indicator.avaliacao]
  const arrow = variationArrow(indicator)
  const detail = indicator.detalhe
  return (
    <StatTile
      testId={`indicator-${indicator.id}`}
      label={indicator.titulo}
      hint={indicator.explicacao}
      value={formatIndicatorValue(indicator.atual, indicator.unidade)}
      warning={indicator.aviso}
      change={(
        <>
          <span className={cn('font-semibold tabular-nums', evaluation.textColor)}>
            {arrow ? <span aria-hidden="true">{arrow}</span> : null}
            <span title={indicator.variacao_pp !== null ? 'Pontos percentuais' : undefined}>
              {formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)}
            </span>
          </span>
          <Badge variant={evaluation.tone}>{evaluation.label}</Badge>
        </>
      )}
      footnote={(
        <div className="flex flex-col gap-2 pt-1">
          <ComparisonBars base={indicator.base} atual={indicator.atual} unit={indicator.unidade} tone={evaluation.barColor} />
          {detail ? (
            <span className="border-border block border-t pt-2">
              {detail.titulo}: {formatIndicatorValue(detail.atual, detail.unidade)} · antes {formatIndicatorValue(detail.base, detail.unidade)}
            </span>
          ) : null}
        </div>
      )}
    />
  )
}

/** Classes estáticas para o Tailwind gerar: largura da área na grade de 12 e indicadores lado a lado. */
const GROUP_SPAN: Record<number, string> = {
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  6: 'xl:col-span-6',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  12: 'xl:col-span-12'
}
const GROUP_COLUMNS = ['', 'xl:grid-cols-1', 'xl:grid-cols-2', 'xl:grid-cols-3', 'xl:grid-cols-4']

/**
 * Indicadores do Painel agrupados por área numa grade sem buracos: as áreas se encaixam em linhas de até
 * 4 indicadores e cada linha se estica para ocupar a largura toda.
 * Cada bloco mostra o valor atual, a variação com o selo e as barras "Antes" e "Agora" na mesma escala.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Grade com um bloco por indicador, agrupado por área.
 */
export function IndicatorGroups({ groups }: { groups: IndicatorGroup[] }) {
  const layout = packGroupSpans(groups.map((group) => group.indicadores.length))
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-6 xl:grid-cols-12">
      {groups.map((group, groupIndex) => {
        const { span, columns } = layout[groupIndex]
        return (
          <section
            key={group.id}
            aria-labelledby={`grupo-${group.id}`}
            className={cn('flex min-w-0 flex-col gap-2', GROUP_SPAN[span] ?? 'xl:col-span-12')}
          >
            <GroupHeading id={group.id} title={group.titulo} />
            <div className={cn('grid flex-1 grid-cols-1 gap-3', columns > 1 ? 'sm:grid-cols-2' : null, GROUP_COLUMNS[columns])}>
              {group.indicadores.map((indicator) => <IndicatorTile key={indicator.id} indicator={indicator} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
