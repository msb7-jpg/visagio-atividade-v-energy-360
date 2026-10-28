import { ArrowDownRight, ArrowUpRight, Info, Minus, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { IndicatorEvaluation } from '@/features/executive_dashboard/types/executiveDashboardTypes'

interface EvaluationEntry {
  label: string
  tone: NonNullable<BadgeProps['variant']>
  icon: LucideIcon
}

/** Vocabulário fechado da avaliação (design: "Sempre texto + cor"). */
const EVALUATIONS: Record<IndicatorEvaluation, EvaluationEntry> = {
  MELHOROU: { label: 'Melhorou', tone: 'success', icon: ArrowUpRight },
  PIOROU: { label: 'Piorou', tone: 'destructive', icon: ArrowDownRight },
  ESTAVEL: { label: 'Estável', tone: 'muted', icon: Minus },
  SEM_COMPARACAO: { label: 'Sem comparação', tone: 'muted', icon: Minus },
  INFORMATIVO: { label: 'Informativo', tone: 'accent', icon: Info }
}

/**
 * Selo que diz se o indicador melhorou, piorou ou ficou estável entre os dois períodos.
 *
 * @param props - Avaliação devolvida pelo backend.
 * @returns Badge com texto, cor semântica e ícone decorativo.
 */
export function EvaluationBadge({ evaluation }: { evaluation: IndicatorEvaluation }) {
  const entry = EVALUATIONS[evaluation]
  const Icon = entry.icon
  return (
    <Badge variant={entry.tone} className="gap-1">
      <Icon aria-hidden="true" className="size-3" />
      {entry.label}
    </Badge>
  )
}
