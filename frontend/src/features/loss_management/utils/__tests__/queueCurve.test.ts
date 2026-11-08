import { describe, expect, it } from 'vitest'
import type { ReturnCurve } from '@/features/loss_management/types/queueCurveTypes'
import { describeCut, parseCostInput, parsePositiveInt } from '@/features/loss_management/utils/queueCurve'

function makeCurve(overrides: Partial<ReturnCurve> = {}): ReturnCurve {
  return {
    total_ucs: 31,
    tarifa_rs_kwh: 0.7876,
    custo_inspecao_rs: 150,
    corte_sugerido: 3,
    pontos: [{ posicao: 31, kwh_mes_acumulado: 150, valor_ano_acumulado_rs: 1415 }],
    ...overrides
  }
}

describe('parseCostInput', () => {
  it.each([
    ['150', 150],
    ['150,50', 150.5],
    ['1.240', 1240],
    ['0', 0]
  ])('lê %s como %s reais', (text, expected) => {
    expect(parseCostInput(text)).toBe(expected)
  })

  it.each([[''], ['   '], ['abc'], ['-5']])('não lê "%s" como custo, e a tela fica sem corte', (text) => {
    expect(parseCostInput(text)).toBeNull()
  })
})

describe('parsePositiveInt', () => {
  it('aceita inteiros a partir de 1', () => {
    expect(parsePositiveInt('10')).toBe(10)
    expect(parsePositiveInt(' 200 ')).toBe(200)
  })

  it.each([[''], ['0'], ['-3'], ['2,5'], ['abc']])('recusa "%s"', (text) => {
    expect(parsePositiveInt(text)).toBeNull()
  })
})

describe('describeCut', () => {
  it('pede o custo quando ele não foi informado', () => {
    expect(describeCut(makeCurve({ custo_inspecao_rs: null, corte_sugerido: null }))).toBe(
      'Informe o custo de uma inspeção para ver onde parar.'
    )
  })

  it('diz quantas UCs valem a pena para o custo informado', () => {
    expect(describeCut(makeCurve())).toMatch(/vale inspecionar as 3 primeiras UCs de 31/)
  })

  it('usa o singular quando só a primeira UC compensa', () => {
    expect(describeCut(makeCurve({ corte_sugerido: 1 }))).toMatch(/vale inspecionar a primeira UC de 31/)
  })

  it('avisa que nenhuma visita se paga quando o corte é zero', () => {
    expect(describeCut(makeCurve({ corte_sugerido: 0 }))).toMatch(/nenhuma inspeção se paga/)
  })

  it('avisa que não há UC livre quando a fila está vazia', () => {
    expect(describeCut(makeCurve({ total_ucs: 0, pontos: [], corte_sugerido: 0 }))).toBe('Nenhuma UC livre na fila.')
  })
})
