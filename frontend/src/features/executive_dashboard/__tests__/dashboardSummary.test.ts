import { describe, expect, it } from 'vitest'
import type { Indicator, IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import {
  countEvaluations,
  extractMetricsFromGroups,
  indicatorsWithoutVariation,
  packGroupSpans,
  rankedVariations
} from '@/features/executive_dashboard/utils/dashboardSummary'

const indicatorOf = (id: string, overrides: Partial<Indicator>): Indicator => ({
  id,
  titulo: id,
  unidade: 'RS',
  base: 100,
  atual: 110,
  variacao_pct: 10,
  variacao_pp: null,
  sentido: 'MAIOR_MELHOR',
  avaliacao: 'MELHOROU',
  explicacao: '',
  detalhe: null,
  aviso: null,
  ...overrides
})

const groups: IndicatorGroup[] = [
  { id: 'comercial', titulo: 'Comercial', indicadores: [indicatorOf('receita', {}), indicatorOf('energia', { variacao_pct: -5, avaliacao: 'PIOROU' })] },
  { id: 'rede', titulo: 'Rede', indicadores: [indicatorOf('dec', { variacao_pct: 134, avaliacao: 'PIOROU' })] },
  { id: 'medicao', titulo: 'Medição', indicadores: [indicatorOf('solar', { base: 0, variacao_pct: null, avaliacao: 'INFORMATIVO' })] }
]

describe('dashboardSummary', () => {
  it('conta as avaliações já feitas pelo backend', () => {
    expect(countEvaluations(groups)).toEqual({ MELHOROU: 1, PIOROU: 2, ESTAVEL: 0, SEM_COMPARACAO: 0, INFORMATIVO: 1 })
  })

  it('ordena pelo tamanho da variação e separa os sem base', () => {
    expect(rankedVariations(groups).map((indicator) => indicator.id)).toEqual(['dec', 'receita', 'energia'])
    expect(indicatorsWithoutVariation(groups).map((indicator) => indicator.id)).toEqual(['solar'])
  })

  it('encaixa as áreas em linhas de até 4 indicadores que ocupam a largura toda', () => {
    // Formato do banco real: Comercial 4, Cobrança 1, Rede 2, Atendimento 2, Medição 2.
    expect(packGroupSpans([4, 1, 2, 2, 2])).toEqual([
      { span: 12, columns: 4 },
      { span: 4, columns: 1 },
      { span: 8, columns: 2 },
      { span: 6, columns: 2 },
      { span: 6, columns: 2 }
    ])
    expect(packGroupSpans([6, 3])).toEqual([{ span: 12, columns: 4 }, { span: 12, columns: 3 }])
  })

  it('monta o mapa de métricas do resumo da IA', () => {
    expect(extractMetricsFromGroups(undefined)).toBeUndefined()
    expect(extractMetricsFromGroups([groups[2]])).toEqual({ solar_atual: 110, solar_base: 0 })
  })
})
