import { CircleAlert, CircleCheck, CircleDashed, CircleMinus, Info, type LucideIcon } from 'lucide-react'
import type { BadgeProps } from '@/components/ui/badge'
import type { Indicator, IndicatorEvaluation } from '@/features/executive_dashboard/types/executiveDashboardTypes'

interface EvaluationEntry {
  label: string
  /** Rótulo no plural, usado no placar ("2 melhoraram"). */
  plural: string
  tone: NonNullable<BadgeProps['variant']>
  textColor: string
  /** Preenchimento das marcas de gráfico (barras, faixas e pastilhas) dessa avaliação. */
  barColor: string
}

/** Vocabulário fechado da avaliação: o texto aparece sempre junto da cor. */
export const EVALUATIONS: Record<IndicatorEvaluation, EvaluationEntry> = {
  MELHOROU: { label: 'Melhorou', plural: 'Melhoraram', tone: 'success', textColor: 'text-success', barColor: 'bg-success' },
  PIOROU: { label: 'Piorou', plural: 'Pioraram', tone: 'destructive', textColor: 'text-destructive', barColor: 'bg-destructive' },
  ESTAVEL: { label: 'Estável', plural: 'Estáveis', tone: 'muted', textColor: 'text-muted-foreground', barColor: 'bg-chart-4' },
  SEM_COMPARACAO: {
    label: 'Sem comparação',
    plural: 'Sem comparação',
    tone: 'muted',
    textColor: 'text-muted-foreground',
    barColor: 'bg-border'
  },
  INFORMATIVO: { label: 'Informativo', plural: 'Informativos', tone: 'accent', textColor: 'text-muted-foreground', barColor: 'bg-chart-1' }
}

/** Ícone de cada avaliação: a cor nunca aparece sozinha. */
export const EVALUATION_ICONS: Record<IndicatorEvaluation, LucideIcon> = {
  MELHOROU: CircleCheck,
  PIOROU: CircleAlert,
  ESTAVEL: CircleMinus,
  INFORMATIVO: Info,
  SEM_COMPARACAO: CircleDashed
}

/** Ordem de leitura das avaliações no placar e nas legendas: do bom para o ruim, e os neutros no fim. */
export const EVALUATION_ORDER: IndicatorEvaluation[] = ['MELHOROU', 'ESTAVEL', 'PIOROU', 'INFORMATIVO', 'SEM_COMPARACAO']

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
