import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PERIODS,
  competenciasOf,
  isDefaultPeriods,
  periodsFromParams,
  periodsProblem
} from '@/features/executive_dashboard/utils/dashboardPeriods'
import {
  formatIndicatorChange,
  formatIndicatorValue,
  formatVariation
} from '@/features/executive_dashboard/utils/indicatorFormatters'

describe('dashboardPeriods', () => {
  it('lista as competências atravessando a virada do ano', () => {
    expect(competenciasOf({ competencia_inicio: '2025-11', competencia_fim: '2026-02' })).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02'
    ])
    expect(competenciasOf({ competencia_inicio: '2026-02', competencia_fim: '2026-01' })).toEqual([])
  })

  it('usa o padrão do case para parâmetros ausentes ou malformados', () => {
    const periods = periodsFromParams(new URLSearchParams('base_inicio=2022-13&atual_fim=2026-05'))

    expect(periods.base).toEqual(DEFAULT_PERIODS.base)
    expect(periods.atual.competencia_fim).toBe('2026-05')
    expect(isDefaultPeriods(periods)).toBe(false)
    expect(isDefaultPeriods(periodsFromParams(new URLSearchParams()))).toBe(true)
  })

  it('recusa período invertido ou sobreposto', () => {
    const inverted = { ...DEFAULT_PERIODS, base: { competencia_inicio: '2023-06', competencia_fim: '2022-07' } }
    const overlapping = { ...DEFAULT_PERIODS, base: { competencia_inicio: '2022-07', competencia_fim: '2025-07' } }

    expect(periodsProblem(inverted)).toContain('início')
    expect(periodsProblem(overlapping)).toContain('terminar antes')
    expect(periodsProblem(DEFAULT_PERIODS)).toBeNull()
  })
})

describe('indicatorFormatters', () => {
  it('formata pela unidade e mostra travessão sem valor', () => {
    expect(formatIndicatorValue(8.04, 'PCT')).toBe('8%')
    expect(formatIndicatorValue(3.9, 'NOTA')).toBe('3,90')
    expect(formatIndicatorValue(null, 'RS')).toBe('—')
    expect(formatVariation(-3.8)).toBe('-3,8%')
    expect(formatVariation(null)).toBe('—')
    expect(formatIndicatorChange(1.4, 0.05)).toBe('+0,05 ponto percentual')
    expect(formatIndicatorChange(-16.4, -3.1)).toBe('-3,1 pontos percentuais')
    expect(formatIndicatorChange(8, null)).toBe('+8%')
  })
})
