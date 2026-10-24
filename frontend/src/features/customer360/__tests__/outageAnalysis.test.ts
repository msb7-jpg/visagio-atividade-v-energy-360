import { describe, expect, it } from 'vitest'
import type { FeederQualityMonth } from '@/features/customer360/types/customer360Types'
import { analyzeOutages } from '@/features/customer360/utils/outageAnalysis'

function month(competencia: string, hours: number): FeederQualityMonth {
  return {
    competencia,
    dec_apurado_horas: hours,
    fec_apurado_vezes: 1,
    dec_limite_aneel: null,
    fec_limite_aneel: null,
    violou_meta: false
  }
}

describe('analyzeOutages', () => {
  it('destaca apenas meses acima de 1,5 vez a média do próprio alimentador', () => {
    const overview = analyzeOutages([month('2026-06', 1.5), month('2026-05', 4.2), month('2026-04', 1.5), month('2026-03', 1.2)])

    expect(overview.averageHours).toBeCloseTo(2.1)
    expect(overview.aboveNormalMonths).toEqual(['2026-05'])
    expect(overview.worstMonth?.competencia).toBe('2026-05')
  })

  it('não marca nada quando as interrupções são parecidas todo mês', () => {
    const overview = analyzeOutages([month('2026-06', 1.5), month('2026-05', 1.6), month('2026-04', 1.4)])

    expect(overview.aboveNormalMonths).toEqual([])
  })

  it('trata alimentador sem dados', () => {
    expect(analyzeOutages([])).toEqual({ averageHours: 0, aboveNormalMonths: [], worstMonth: null })
  })
})
