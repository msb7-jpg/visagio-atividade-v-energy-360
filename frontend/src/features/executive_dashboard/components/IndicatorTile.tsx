import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import { ComparisonBars } from '@/features/executive_dashboard/components/ComparisonBars'
import type { Indicator } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorChange, formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATIONS, variationArrow } from '@/features/executive_dashboard/utils/indicatorTrend'

/**
 * Bloco de um indicador em três camadas, sempre na mesma ordem: valor atual, variação com o selo da avaliação
 * e, no rodapé, as barras "Antes" e "Agora" na mesma escala e o detalhe secundário. O número da variação fica neutro com a seta do
 * sentido; só o selo carrega a cor e o texto de melhorou ou piorou, para o mesmo sinal não aparecer três vezes.
 *
 * @param props - Indicador devolvido pela API.
 * @returns Bloco do indicador, com a fórmula no ícone de ajuda.
 */
export function IndicatorTile({ indicator }: { indicator: Indicator }) {
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
          <span className="text-foreground font-semibold tabular-nums">
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
