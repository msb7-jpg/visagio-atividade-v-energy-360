import type { CSSProperties } from 'react'
import type { ScoreBreakdown } from '@/features/loss_management/types/unitDetailTypes'
import { formatInteger, formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { scoreBarColor } from '@/features/loss_management/utils/scoreTone'
import { cn } from '@/lib/utils'

const SCORE_MAX = 100

interface TermProps {
  label: string
  value: string
  isResult?: boolean
}

function Term({ label, value, isResult = false }: TermProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border p-2.5', isResult ? 'border-primary/30 bg-primary/5' : 'border-border')}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-sm font-semibold whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  )
}

function Operator({ symbol }: { symbol: string }) {
  return <span className="text-muted-foreground shrink-0 text-sm" aria-hidden="true">{symbol}</span>
}

interface UnitScoreCalculationProps {
  breakdown: ScoreBreakdown
}

/**
 * O score de 0 a 100 em destaque, com a barra na cor da faixa, e a conta da energia recuperável em três blocos.
 * O score compara a UC com a primeira da fila; a chance de acerto continua no cálculo do backend, mas não é exibida.
 *
 * @param props - Decomposição devolvida pelo backend.
 * @returns Score com medidor e a conta kWh/mês × meses = kWh a recuperar.
 */
export function UnitScoreCalculation({ breakdown }: UnitScoreCalculationProps) {
  const score = formatInteger(breakdown.score)
  const months = breakdown.meses_janela_recuperacao
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-baseline gap-1" aria-hidden="true">
          <span className="text-foreground text-3xl font-semibold tabular-nums">{score}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
        <span className="sr-only">Score {score} de 100</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div
            role="meter"
            aria-label={`Score ${score} de ${SCORE_MAX}`}
            aria-valuemin={0}
            aria-valuemax={SCORE_MAX}
            aria-valuenow={breakdown.score}
            className="bg-muted h-2 overflow-hidden rounded-full"
          >
            <div
              className={cn('h-full w-(--bar-width) rounded-full', scoreBarColor(breakdown.score))}
              style={{ '--bar-width': `${breakdown.score}%` } as CSSProperties}
            />
          </div>
          <span className="text-muted-foreground text-xs">Energia a recuperar comparada à 1ª UC da fila</span>
        </div>
      </div>
      <dl className="flex flex-wrap items-center gap-2">
        <Term label="Recuperável por mês" value={formatKwh(breakdown.kwh_mes_recuperavel)} />
        <Operator symbol="×" />
        <Term label="Janela" value={`${months} ${months === 1 ? 'mês' : 'meses'}`} />
        <Operator symbol="=" />
        <Term label="A recuperar" value={formatKwh(breakdown.kwh_janela_recuperavel)} isResult />
      </dl>
    </div>
  )
}
