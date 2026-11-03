import type { MonthlyConsumption } from '@/features/loss_management/types/unitDetailTypes'

/** Mesmas janelas do backend (`MESES_JANELA_RECENTE` e `MESES_JANELA_BASE` em `queries.py`). */
const RECENT_WINDOW_MONTHS = 3
const BASE_WINDOW_MONTHS = 12

interface CompetenciaRange {
  first: string
  last: string
}

export interface ScoreWindows {
  /** Os 12 meses antes da janela recente; recortada ao que a série mostra. Nula sem meses suficientes. */
  base: CompetenciaRange | null
  /** Os 3 últimos meses, que formam o consumo recente do score. */
  recent: CompetenciaRange
}

/**
 * Localiza na série as janelas que o score usa, contadas a partir da competência de referência (a última).
 *
 * @param months - Série em ordem crescente e sem buracos, terminando na competência de referência.
 * @returns Janelas recente e base; a base é cortada no início da série quando ela é mais curta que 15 meses.
 */
export function findScoreWindows(months: MonthlyConsumption[]): ScoreWindows | null {
  const recentStart = months.length - RECENT_WINDOW_MONTHS
  if (recentStart < 0) return null
  const baseStart = Math.max(0, recentStart - BASE_WINDOW_MONTHS)
  return {
    recent: { first: months[recentStart].competencia, last: months[months.length - 1].competencia },
    base: recentStart > baseStart ? { first: months[baseStart].competencia, last: months[recentStart - 1].competencia } : null
  }
}
