import type { ReactNode } from 'react'
import type { ScoreBreakdown } from '@/features/loss_management/types/unitDetailTypes'
import { formatInteger, formatKwh, formatPercent } from '@/features/loss_management/utils/lossFormatters'

interface CalculationLineProps {
  label: string
  children: ReactNode
  isResult?: boolean
}

function CalculationLine({ label, children, isResult = false }: CalculationLineProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={isResult ? 'text-foreground font-bold' : 'font-mono'}>{children}</dd>
    </div>
  )
}

interface UnitScoreCalculationProps {
  breakdown: ScoreBreakdown
}

/**
 * A conta do score com os números da UC: energia recuperável da janela x chance de acerto = kWh esperado,
 * e o kWh esperado relativo ao topo da fila vira o score de 0 a 100.
 *
 * @param props - Decomposição devolvida pelo backend.
 * @returns Quatro linhas de conta, a última com o score em destaque.
 */
export function UnitScoreCalculation({ breakdown }: UnitScoreCalculationProps) {
  const monthsLabel = breakdown.meses_janela_recuperacao === 1 ? 'mês' : 'meses'
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <CalculationLine
        label={`Energia recuperável: ${formatKwh(breakdown.kwh_mes_recuperavel)}/mês × ${breakdown.meses_janela_recuperacao} ${monthsLabel}`}
      >
        {formatKwh(breakdown.kwh_janela_recuperavel)}
      </CalculationLine>
      <CalculationLine label="Chance de acerto da inspeção">× {formatPercent(breakdown.probabilidade_acerto)}</CalculationLine>
      <CalculationLine label="kWh esperado">= {formatKwh(breakdown.kwh_esperado)}</CalculationLine>
      <CalculationLine label={`Relativo ao topo da fila (${formatKwh(breakdown.maior_kwh_esperado_fila)}) × 100`} isResult>
        Score {formatInteger(breakdown.score)} de 100
      </CalculationLine>
    </dl>
  )
}
