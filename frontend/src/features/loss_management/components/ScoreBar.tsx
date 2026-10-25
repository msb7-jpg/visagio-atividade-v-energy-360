import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const SCORE_MAX = 100
const SCORE_HIGH = 85
const SCORE_MEDIUM = 65

interface ScoreBarProps {
  /** Prioridade de 0 a 100 (kWh esperado relativo ao topo da fila). */
  score: number
}

function barColor(score: number): string {
  if (score >= SCORE_HIGH) return 'bg-destructive'
  if (score >= SCORE_MEDIUM) return 'bg-warning'
  return 'bg-muted-foreground'
}

/**
 * Barra de score da UC: a cor segue a faixa de prioridade (alta, média, baixa) e o número fica ao lado.
 *
 * @param props - Score de 0 a 100.
 * @returns Medidor com barra proporcional ao score e o valor em texto.
 */
export function ScoreBar({ score }: ScoreBarProps) {
  return (
    <div
      role="meter"
      aria-label={`Score ${score} de ${SCORE_MAX}`}
      aria-valuemin={0}
      aria-valuemax={SCORE_MAX}
      aria-valuenow={score}
      className="flex items-center gap-2"
    >
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div
          className={cn('h-full w-(--bar-width) rounded-full', barColor(score))}
          style={{ '--bar-width': `${score}%` } as CSSProperties}
        />
      </div>
      <span className="text-foreground w-7 text-right text-sm font-bold">{score}</span>
    </div>
  )
}
