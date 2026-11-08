import { describe, expect, it } from 'vitest'
import { axisFormatOf, SERIES_TOKENS, seriesStroke } from '@/features/revenue/utils/comparisonSeries'
import { HISTORY_METRICS } from '@/features/revenue/utils/revenueHistoryMetrics'
import { readTokens } from '@/test/contrastTokens'

const strokes = SERIES_TOKENS.map((_, index) => seriesStroke(index))

describe('seriesStroke', () => {
  it('dá a cada série uma cor de traço diferente das outras', () => {
    expect(new Set(strokes).size).toBe(SERIES_TOKENS.length)
  })

  it.each([':root', '.dark'] as const)('aponta para um token de gráfico definido no tema %s, com cores distintas', (theme) => {
    const tokens = readTokens(theme)
    const colors = strokes.map((stroke) => {
      const name = /^var\(--(chart-[1-5])\)$/.exec(stroke)?.[1]
      expect(name, `traço ${stroke} deve ser var(--chart-N)`).toBeDefined()
      expect(tokens[name as string], `${name} definido em ${theme}`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      return tokens[name as string]
    })
    expect(new Set(colors).size).toBe(strokes.length)
  })
})

describe('axisFormatOf', () => {
  const metric = (key: string) => HISTORY_METRICS.find((candidate) => candidate.key === key) ?? HISTORY_METRICS[0]

  it('mostra a tarifa em reais com duas casas no eixo', () => {
    expect(axisFormatOf(metric('tarifa_media_rs_kwh'))(0.75)).toMatch(/^R\$\s0,75$/)
  })

  it('mantém a receita compacta e o volume em MWh', () => {
    expect(axisFormatOf(metric('receita_rs'))(100_000)).toMatch(/^R\$\s100(,0)?\smil$/)
    expect(axisFormatOf(metric('volume_kwh'))(100_000)).toMatch(/MWh$/)
  })
})
