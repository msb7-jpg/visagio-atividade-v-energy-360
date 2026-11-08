import type { ReactNode } from 'react'
import type { ScoreBreakdown } from '@/features/loss_management/types/unitDetailTypes'
import { formatInteger, formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { cn } from '@/lib/utils'

interface CalculationLineProps {
  label: string
  children: ReactNode
  isResult?: boolean
}

function CalculationLine({ label, children, isResult = false }: CalculationLineProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', isResult ? 'border-border border-t pt-2' : '')}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={isResult ? 'text-foreground text-xl font-semibold whitespace-nowrap' : 'whitespace-nowrap'}>
        {children}
      </dd>
    </div>
  )
}

interface UnitScoreCalculationProps {
  breakdown: ScoreBreakdown
}

/**
 * O cartão do score com os números da UC: a energia recuperável da janela e o score de 0 a 100, que compara a UC
 * com a primeira da fila. A chance de acerto continua no cálculo do backend, mas não é exibida aqui.
 *
 * @param props - Decomposição devolvida pelo backend.
 * @returns Duas linhas, a última com o score em destaque.
 */
export function UnitScoreCalculation({ breakdown }: UnitScoreCalculationProps) {
  const monthsLabel = breakdown.meses_janela_recuperacao === 1 ? 'mês' : 'meses'
  return (
    <dl className="bg-muted/40 border-border flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <CalculationLine
        label={`Energia recuperável: ${formatKwh(breakdown.kwh_mes_recuperavel)}/mês × ${breakdown.meses_janela_recuperacao} ${monthsLabel}`}
      >
        {formatKwh(breakdown.kwh_janela_recuperavel)}
      </CalculationLine>
      <CalculationLine label="Potencial de recuperação relativo à primeira da fila" isResult>
        Prioridade {formatInteger(breakdown.score)} de 100
      </CalculationLine>
    </dl>
  )
}
