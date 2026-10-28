import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import { EvaluationBadge } from '@/features/executive_dashboard/components/EvaluationBadge'
import type { Indicator } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorChange, formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'

/**
 * Card de um indicador no padrão da Receita 1 do design.md: valor atual, valor base, variação e selo.
 * A explicação do cálculo aparece ao passar o mouse no título.
 *
 * @param props - Indicador devolvido pela API.
 * @returns Card com os dois períodos e, quando houver, o aviso do indicador.
 */
export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  return (
    <Card variant="interactive" data-testid={`indicator-${indicator.id}`}>
      <CardHeader className="pb-2">
        <Tooltip content={indicator.explicacao}>
          <CardTitle className="cursor-help">{indicator.titulo}</CardTitle>
        </Tooltip>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-foreground text-2xl font-bold tracking-tight">
          {formatIndicatorValue(indicator.atual, indicator.unidade)}
        </div>
        <CardDescription>Antes: {formatIndicatorValue(indicator.base, indicator.unidade)}</CardDescription>
        {indicator.detalhe ? (
          <CardDescription>
            {indicator.detalhe.titulo}: {formatIndicatorValue(indicator.detalhe.atual, indicator.detalhe.unidade)}{' '}
            (antes {formatIndicatorValue(indicator.detalhe.base, indicator.detalhe.unidade)})
          </CardDescription>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <EvaluationBadge evaluation={indicator.avaliacao} />
          <span className="text-muted-foreground text-sm">
            {formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)}
          </span>
        </div>
        {indicator.aviso ? (
          <p className="text-warning flex items-start gap-1.5 text-sm">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {indicator.aviso}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
