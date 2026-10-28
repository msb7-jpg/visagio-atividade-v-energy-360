import { describe, expect, it } from 'vitest'
import { historyFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { HISTORY_METRICS, toBarHeights } from '@/features/revenue/utils/revenueHistoryMetrics'

describe('toBarHeights', () => {
  it('põe a maior barra em 100 e as demais proporcionais', () => {
    const heights = toBarHeights(historyFixture.pontos, 'receita_rs')

    expect(heights[2]).toBe(100)
    expect(heights[0]).toBeCloseTo((1200 / 1550) * 100)
  })

  it('trata mês sem faturamento (tarifa nula) como barra vazia', () => {
    expect(toBarHeights(historyFixture.pontos, 'tarifa_media_rs_kwh')[1]).toBe(0)
  })

  it('devolve zeros quando a série inteira é zero', () => {
    const empty = historyFixture.pontos.map((point) => ({ ...point, receita_rs: 0 }))

    expect(toBarHeights(empty, 'receita_rs')).toEqual([0, 0, 0])
  })
})

describe('HISTORY_METRICS', () => {
  it('formata cada métrica em pt-BR', () => {
    const [revenue, volume, tariff] = HISTORY_METRICS

    expect(revenue.format(1550)).toContain('1.550,00')
    expect(volume.format(2500)).toBe('2,5 MWh')
    expect(tariff.format(0.62)).toContain('0,620')
  })
})
