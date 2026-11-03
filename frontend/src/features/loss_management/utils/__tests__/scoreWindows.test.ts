import { describe, expect, it } from 'vitest'
import type { MonthlyConsumption } from '@/features/loss_management/types/unitDetailTypes'
import { findScoreWindows } from '@/features/loss_management/utils/scoreWindows'

function buildSeries(count: number): MonthlyConsumption[] {
  return Array.from({ length: count }, (_, position) => ({
    competencia: `2026-${String(position + 1).padStart(2, '0')}`,
    consumo_kwh: 100
  }))
}

describe('findScoreWindows', () => {
  it('marca os 3 últimos meses como recentes e corta a base no início de uma série de 12 meses', () => {
    const windows = findScoreWindows(buildSeries(12))

    expect(windows?.recent).toEqual({ first: '2026-10', last: '2026-12' })
    expect(windows?.base).toEqual({ first: '2026-01', last: '2026-09' })
  })

  it('usa os 12 meses anteriores como base quando a série tem histórico de sobra', () => {
    const series = buildSeries(15)

    const windows = findScoreWindows(series)

    expect(windows?.base).toEqual({ first: '2026-01', last: '2026-12' })
    expect(windows?.recent).toEqual({ first: '2026-13', last: '2026-15' })
  })

  it('devolve base nula quando a série só tem a janela recente', () => {
    expect(findScoreWindows(buildSeries(3))?.base).toBeNull()
  })

  it('devolve nulo quando a série é menor que a janela recente', () => {
    expect(findScoreWindows(buildSeries(2))).toBeNull()
  })
})
