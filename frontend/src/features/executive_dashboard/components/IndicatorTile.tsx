import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import type { Indicator } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorChange, formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATIONS, variationArrow } from '@/features/executive_dashboard/utils/indicatorTrend'

/**
 * Bloco de um indicador em três camadas, sempre na mesma ordem: valor atual, variação com o selo da avaliação
 * e, no rodapé, o valor do período base e o detalhe secundário. O número da variação fica neutro com a seta do
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
        <>
          <span>Antes: {formatIndicatorValue(indicator.base, indicator.unidade)}</span>
          {detail ? (
            <span className="border-border mt-2 block border-t pt-2">
              {detail.titulo}: {formatIndicatorValue(detail.atual, detail.unidade)} (antes {formatIndicatorValue(detail.base, detail.unidade)})
            </span>
          ) : null}
        </>
      )}
    />
  )
}
