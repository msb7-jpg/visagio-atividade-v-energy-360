import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
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
        <>
          <span>Antes: {formatIndicatorValue(indicator.base, indicator.unidade)}</span>
          {detail ? (
            <span className="block">
              {detail.titulo}: {formatIndicatorValue(detail.atual, detail.unidade)} (antes {formatIndicatorValue(detail.base, detail.unidade)})
            </span>
          ) : null}
        </>
      )}
    />
  )
}

const GROUP_SPAN = ['xl:col-span-1', 'xl:col-span-1', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-4']
const GROUP_COLUMNS = ['xl:grid-cols-1', 'xl:grid-cols-1', 'xl:grid-cols-2', 'xl:grid-cols-3', 'xl:grid-cols-4']

const spanOf = (count: number) => Math.min(Math.max(count, 1), 4)

/**
 * Indicadores do Painel numa grade de 4 colunas: cada área ocupa tantas colunas quantos indicadores tem, com o
 * nome da área acima dos blocos, e as áreas pequenas dividem a mesma linha.
 * A cor e o selo dizem se melhorou ou piorou; a seta segue só o sentido do número.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Grade com um bloco por indicador, agrupado por área.
 */
export function IndicatorGroups({ groups }: { groups: IndicatorGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-6 xl:grid-cols-4">
      {groups.map((group) => {
        const span = spanOf(group.indicadores.length)
        return (
          <section key={group.id} aria-labelledby={`grupo-${group.id}`} className={cn('flex min-w-0 flex-col gap-2', GROUP_SPAN[span])}>
            <h2 id={`grupo-${group.id}`} className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group.titulo}
            </h2>
            <div className={cn('grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2', GROUP_COLUMNS[span])}>
              {group.indicadores.map((indicator) => <IndicatorTile key={indicator.id} indicator={indicator} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
