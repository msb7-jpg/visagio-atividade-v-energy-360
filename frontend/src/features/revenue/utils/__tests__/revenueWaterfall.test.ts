import { describe, expect, it } from 'vitest'
import { decompositionFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { buildInsight, buildWaterfallAxis, buildWaterfallSteps } from '@/features/revenue/utils/revenueWaterfall'

describe('buildWaterfallSteps', () => {
  it('monta seis colunas: base, quatro efeitos e atual', () => {
    const steps = buildWaterfallSteps(decompositionFixture)

    expect(steps.map((step) => step.key)).toEqual(['base', 'preco', 'volume', 'mix', 'cruzado', 'atual'])
  })

  it('encadeia os níveis: o fim de cada efeito é o começo do próximo e termina na receita atual', () => {
    const steps = buildWaterfallSteps(decompositionFixture)
    const effects = steps.slice(1, 5)

    effects.slice(1).forEach((step, index) => expect(step.from).toBeCloseTo(effects[index].to))
    expect(effects[0].from).toBe(decompositionFixture.receita_base_rs)
    expect(effects[3].to).toBeCloseTo(decompositionFixture.receita_atual_rs)
  })

  it('classifica alta e queda pelo sinal do efeito', () => {
    const steps = buildWaterfallSteps(decompositionFixture)

    expect(steps.map((step) => step.kind)).toEqual(['total', 'increase', 'decrease', 'decrease', 'increase', 'total'])
  })
})

describe('buildWaterfallAxis', () => {
  const axis = buildWaterfallAxis(buildWaterfallSteps(decompositionFixture))

  it('começa o eixo acima de zero para os efeitos ficarem visíveis', () => {
    expect(axis.min).toBeGreaterThan(0)
    expect(axis.min).toBeLessThan(62452.8)
    expect(axis.max).toBeGreaterThan(65040)
  })

  it('mantém todas as colunas dentro do gráfico', () => {
    axis.bars.forEach((bar) => {
      expect(bar.bottomPct).toBeGreaterThanOrEqual(0)
      expect(bar.bottomPct + bar.heightPct).toBeLessThanOrEqual(100.001)
      expect(bar.heightPct).toBeGreaterThan(0)
    })
  })

  it('apoia as colunas de total na base do eixo', () => {
    expect(axis.bars[0].bottomPct).toBe(0)
    expect(axis.bars[5].bottomPct).toBe(0)
  })

  it('não quebra quando não há variação nenhuma', () => {
    const flat = { ...decompositionFixture, efeito_preco_rs: 0, efeito_volume_rs: 0, efeito_mix_rs: 0, efeito_cruzado_rs: 0 }

    const flatAxis = buildWaterfallAxis(buildWaterfallSteps({ ...flat, receita_atual_rs: flat.receita_base_rs }))

    flatAxis.bars.forEach((bar) => expect(Number.isFinite(bar.heightPct)).toBe(true))
  })
})

describe('buildInsight', () => {
  it('aponta a queda e o efeito de maior peso', () => {
    const text = buildInsight(decompositionFixture)

    expect(text).toContain('caiu')
    expect(text).toContain('efeito-volume')
  })

  it('descreve alta quando a variação é positiva', () => {
    expect(buildInsight({ ...decompositionFixture, variacao_rs: 500, variacao_pct: 1 })).toContain('subiu')
  })

  it('descreve estabilidade quando a variação é zero', () => {
    expect(buildInsight({ ...decompositionFixture, variacao_rs: 0, variacao_pct: 0 })).toContain('estável')
  })
})
