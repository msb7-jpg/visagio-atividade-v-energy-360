import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface ShareBarProps {
  /** Preenchimento de 0 a 100. */
  percent: number
  /** Classe semântica de cor do preenchimento (ex.: `bg-primary`). */
  tone?: string
}

/**
 * Barra horizontal proporcional, preenchida via variável CSS (sem estilo inline dinâmico).
 *
 * @param props - Percentual de preenchimento e cor semântica.
 * @returns Trilho com o preenchimento.
 */
export function ShareBar({ percent, tone = 'bg-primary' }: ShareBarProps) {
  return (
    <div className="bg-muted h-2 w-full rounded-lg">
      <div
        className={cn('h-2 w-(--bar-width) rounded-lg', tone)}
        style={{ '--bar-width': `${Math.min(Math.max(percent, 0), 100)}%` } as CSSProperties}
      />
    </div>
  )
}
