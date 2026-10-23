import type { FeederQualityMonth } from '@/features/customer360/types/customer360Types'

const ABOVE_NORMAL_FACTOR = 1.5

export interface OutageOverview {
  averageHours: number
  aboveNormalMonths: string[]
  worstMonth: FeederQualityMonth | null
}

function outageHours(month: FeederQualityMonth): number {
  return month.dec_apurado_horas ?? 0
}

/**
 * Compara os meses do alimentador entre si: média de horas sem energia, meses acima do normal e pior mês.
 * Segue o glossário do case, que usa DEC/FEC para comparar períodos e não contra limites regulatórios reais.
 *
 * @param months - Continuidade mensal do alimentador retornada por `/events`.
 * @returns Média de horas, competências acima de 1,5× a média e o mês com mais horas sem energia.
 */
export function analyzeOutages(months: FeederQualityMonth[]): OutageOverview {
  if (months.length === 0) {
    return { averageHours: 0, aboveNormalMonths: [], worstMonth: null }
  }
  const totalHours = months.reduce((accumulated, month) => accumulated + outageHours(month), 0)
  const averageHours = totalHours / months.length
  const threshold = averageHours * ABOVE_NORMAL_FACTOR
  const aboveNormalMonths = months
    .filter((month) => outageHours(month) > 0 && outageHours(month) > threshold)
    .map((month) => month.competencia)
  const worstMonth = months.reduce((worst, month) => (outageHours(month) > outageHours(worst) ? month : worst), months[0])
  return { averageHours, aboveNormalMonths, worstMonth }
}
