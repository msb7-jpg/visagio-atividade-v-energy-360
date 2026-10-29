import type { BadgeProps } from '@/components/ui/badge'
import type { Indicator, IndicatorEvaluation } from '@/features/executive_dashboard/types/executiveDashboardTypes'

interface EvaluationEntry {
  label: string
  tone: NonNullable<BadgeProps['variant']>
  textColor: string
}

/** Vocabulário fechado da avaliação: o texto aparece sempre junto da cor. */
export const EVALUATIONS: Record<IndicatorEvaluation, EvaluationEntry> = {
  MELHOROU: { label: 'Melhorou', tone: 'success', textColor: 'text-success' },
  PIOROU: { label: 'Piorou', tone: 'destructive', textColor: 'text-destructive' },
  ESTAVEL: { label: 'Estável', tone: 'muted', textColor: 'text-muted-foreground' },
  SEM_COMPARACAO: { label: 'Sem comparação', tone: 'muted', textColor: 'text-muted-foreground' },
  INFORMATIVO: { label: 'Informativo', tone: 'accent', textColor: 'text-muted-foreground' }
}

/**
 * Seta da variação pelo sentido do número (subiu, caiu ou igual), independente de ser bom ou ruim.
 * Quem diz se é bom ou ruim é a cor e o selo da avaliação.
 *
 * @param indicator - Indicador devolvido pela API.
 * @returns "↑ ", "↓ ", "= " ou vazio quando não há comparação.
 */
export function variationArrow(indicator: Pick<Indicator, 'variacao_pct' | 'variacao_pp'>): string {
  const change = indicator.variacao_pp ?? indicator.variacao_pct
  if (change === null) return ''
  if (change > 0) return '↑ '
  if (change < 0) return '↓ '
  return '= '
}
