import { describe, expect, it } from 'vitest'
import { EVALUATIONS, variationArrow } from '@/features/executive_dashboard/utils/indicatorTrend'

describe('indicatorTrend', () => {
  it('aponta a seta pelo sentido do número, não pela avaliação', () => {
    expect(variationArrow({ variacao_pct: 125, variacao_pp: null })).toBe('↑ ')
    expect(variationArrow({ variacao_pct: -1.6, variacao_pp: -0.09 })).toBe('↓ ')
    expect(variationArrow({ variacao_pct: 1.4, variacao_pp: 0.05 })).toBe('↑ ')
    expect(variationArrow({ variacao_pct: 0, variacao_pp: null })).toBe('= ')
    expect(variationArrow({ variacao_pct: null, variacao_pp: null })).toBe('')
  })

  it('dá a cor e o texto pela avaliação', () => {
    expect(EVALUATIONS.PIOROU).toMatchObject({ label: 'Piorou', textColor: 'text-destructive' })
    expect(EVALUATIONS.MELHOROU).toMatchObject({ label: 'Melhorou', textColor: 'text-success' })
  })
})
