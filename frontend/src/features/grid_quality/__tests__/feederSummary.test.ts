import { describe, expect, it } from 'vitest'
import type { FeederHistoryPoint } from '@/features/grid_quality/types/qualityTypes'
import { gapToLimit, isPartialYear, lastMonths, worstMonth, yearlyDec } from '@/features/grid_quality/utils/feederSummary'

const pointOf = (competencia: string, monthHours: number, yearHours: number): FeederHistoryPoint => ({
  competencia,
  dec_apurado_horas: monthHours,
  fec_apurado_vezes: 1,
  dec_acumulado_ano_horas: yearHours,
  fec_acumulado_ano_vezes: 1,
  dec_limite_horas: 12,
  fec_limite_vezes: 8,
  conjunto_aneel: 'JABOATAO',
  criterio_limite: 'CONJUNTO',
  ucs_atendidas: 20
})

// Formato do banco real: a base começa em jul/2022, e o acumulado zera em janeiro.
const points = [
  pointOf('2022-11', 2.5, 11.1),
  pointOf('2022-12', 2.3, 13.4),
  pointOf('2023-01', 2.4, 2.4),
  pointOf('2023-02', 15.2, 17.6)
]

describe('feederSummary', () => {
  it('fecha o DEC de cada ano pelo acumulado do último mês com dado', () => {
    expect(yearlyDec(points)).toEqual([
      { year: '2022', decHours: 13.4, limitHours: 12, months: 2 },
      { year: '2023', decHours: 17.6, limitHours: 12, months: 2 }
    ])
    expect(isPartialYear({ year: '2024', decHours: 27.7, limitHours: 12, months: 12 })).toBe(false)
  })

  it('separa os últimos meses e acha o pior', () => {
    expect(lastMonths(points, 2).map((point) => point.competencia)).toEqual(['2023-01', '2023-02'])
    expect(worstMonth(points)?.competencia).toBe('2023-02')
    expect(worstMonth([])).toBeUndefined()
  })

  it('mede a distância até o limite', () => {
    expect(gapToLimit(14.81, 12)).toBeCloseTo(2.81)
    expect(gapToLimit(10, 12)).toBe(-2)
    expect(gapToLimit(10, null)).toBeNull()
  })
})
