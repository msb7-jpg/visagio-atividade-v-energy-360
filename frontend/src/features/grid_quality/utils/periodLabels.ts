import { formatCompetencia } from '@/features/grid_quality/utils/qualityFormatters'
import type { ContinuityPeriods, PeriodRange } from '@/features/grid_quality/types/continuityTypes'

/** Textos dos dois períodos da Continuidade, escritos com as datas em vez de "A" e "B". */
export interface PeriodLabels {
  /** Ex.: `07/2025 a 06/2026`. */
  current: string
  previous: string
  /** Ex.: `2025–26`, para cabeçalhos de tabela. */
  currentYears: string
  previousYears: string
}

function rangeLabel(range: PeriodRange): string {
  return `${formatCompetencia(range.start)} a ${formatCompetencia(range.end)}`
}

function yearsLabel(range: PeriodRange): string {
  const startYear = range.start.slice(0, 4)
  const endYear = range.end.slice(0, 4)
  return startYear === endYear ? startYear : `${startYear}–${endYear.slice(2)}`
}

/**
 * Monta os textos dos períodos a partir das competências devolvidas pela API.
 *
 * @param periods - Primeira e última competência de cada período.
 * @returns Intervalo completo e anos de cada período.
 */
export function buildPeriodLabels(periods: ContinuityPeriods): PeriodLabels {
  return {
    current: rangeLabel(periods.current),
    previous: rangeLabel(periods.previous),
    currentYears: yearsLabel(periods.current),
    previousYears: yearsLabel(periods.previous)
  }
}
