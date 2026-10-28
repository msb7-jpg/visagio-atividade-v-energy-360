import type { PriceVolumeDecomposition } from '@/features/revenue/types/revenueTypes'
import { formatSignedCompactCurrency, formatVariation } from '@/features/revenue/utils/revenueFormatters'

export type WaterfallKind = 'total' | 'increase' | 'decrease'

/** Uma coluna da ponte de receita: níveis de início e fim e o valor que ela representa. */
export interface WaterfallStep {
  key: string
  label: string
  explanation: string
  kind: WaterfallKind
  from: number
  to: number
  value: number
}

/** Coluna já convertida em posição dentro do gráfico (percentuais do eixo vertical). */
export interface WaterfallBar extends WaterfallStep {
  bottomPct: number
  heightPct: number
}

/** Eixo vertical da ponte: começa abaixo do menor nível para os efeitos ficarem visíveis. */
export interface WaterfallAxis {
  min: number
  max: number
  bars: WaterfallBar[]
}

const AXIS_PADDING_RATIO = 0.35
const MIN_BAR_HEIGHT_PCT = 1.5

const EFFECTS = [
  {
    key: 'preco',
    label: 'Efeito-preço',
    field: 'efeito_preco_rs',
    explanation:
      '(P₁ − P₀) × Q₀, calculado em cada segmento (classe e local) e somado: quanto a receita mudou só porque a tarifa mudou, mantendo o volume da base.'
  },
  {
    key: 'volume',
    label: 'Efeito-volume',
    field: 'efeito_volume_rs',
    explanation:
      '(Q₁ − Q₀) × tarifa média da base: quanto a receita mudou só porque a energia faturada mudou, sem trocar a composição do consumo.'
  },
  {
    key: 'mix',
    label: 'Efeito-mix',
    field: 'efeito_mix_rs',
    explanation:
      'Soma do efeito de volume de cada segmento menos o efeito de volume puro: troca de composição entre classes e locais com tarifas diferentes.'
  },
  {
    key: 'cruzado',
    label: 'Efeito cruzado',
    field: 'efeito_cruzado_rs',
    explanation: 'ΔP × ΔQ, somado por segmento: interação entre a mudança de preço e a mudança de volume ao mesmo tempo.'
  }
] as const

/**
 * Transforma a decomposição nas seis colunas da ponte: receita base, quatro efeitos e receita atual.
 *
 * @param decomposition - Resposta de `GET /revenue/decomposition`.
 * @returns Colunas em ordem, com o nível acumulado de início e fim de cada uma.
 */
export function buildWaterfallSteps(decomposition: PriceVolumeDecomposition): WaterfallStep[] {
  let running = decomposition.receita_base_rs
  const effectSteps = EFFECTS.map(({ key, label, field, explanation }): WaterfallStep => {
    const value = decomposition[field]
    const step: WaterfallStep = {
      key,
      label,
      explanation,
      kind: value < 0 ? 'decrease' : 'increase',
      from: running,
      to: running + value,
      value
    }
    running += value
    return step
  })
  return [
    {
      key: 'base',
      label: 'Receita base',
      explanation: 'Faturamento da janela base, ponto de partida da ponte.',
      kind: 'total',
      from: 0,
      to: decomposition.receita_base_rs,
      value: decomposition.receita_base_rs
    },
    ...effectSteps,
    {
      key: 'atual',
      label: 'Receita atual',
      explanation: 'Faturamento da janela de comparação: base mais a soma dos quatro efeitos.',
      kind: 'total',
      from: 0,
      to: decomposition.receita_atual_rs,
      value: decomposition.receita_atual_rs
    }
  ]
}

/**
 * Calcula o eixo e a posição de cada coluna. O eixo não começa em zero, senão os efeitos
 * (poucos por cento da receita) ficariam invisíveis; a tela avisa isso ao usuário.
 *
 * @param steps - Colunas devolvidas por `buildWaterfallSteps`.
 * @returns Limites do eixo e colunas com base e altura em porcentagem.
 */
export function buildWaterfallAxis(steps: WaterfallStep[]): WaterfallAxis {
  const levels = steps.flatMap((step) => (step.kind === 'total' ? [step.to] : [step.from, step.to]))
  const top = Math.max(...levels)
  const bottom = Math.min(...levels)
  const padding = (top - bottom) * AXIS_PADDING_RATIO || top * 0.05 || 1
  const min = Math.max(0, bottom - padding)
  const max = top + padding * 0.4
  const span = max - min
  const toPct = (level: number) => ((level - min) / span) * 100
  const bars = steps.map((step) => {
    const low = step.kind === 'total' ? min : Math.min(step.from, step.to)
    const high = Math.max(step.from, step.to)
    return {
      ...step,
      bottomPct: toPct(low),
      heightPct: Math.max(toPct(high) - toPct(low), MIN_BAR_HEIGHT_PCT)
    }
  })
  return { min, max, bars }
}

/**
 * Escreve a leitura em uma frase: o que aconteceu com a receita e qual efeito mais pesou.
 *
 * @param decomposition - Resposta de `GET /revenue/decomposition`.
 * @returns Frase em português para o resumo acima do gráfico.
 */
export function buildInsight(decomposition: PriceVolumeDecomposition): string {
  if (decomposition.variacao_rs === 0) {
    return 'A receita ficou estável entre as janelas.'
  }
  const verb = decomposition.variacao_rs < 0 ? 'caiu' : 'subiu'
  const change = `${formatSignedCompactCurrency(decomposition.variacao_rs)} (${formatVariation(decomposition.variacao_pct)})`
  const main = EFFECTS.reduce((best, effect) =>
    Math.abs(decomposition[effect.field]) > Math.abs(decomposition[best.field]) ? effect : best
  )
  const mainValue = formatSignedCompactCurrency(decomposition[main.field])
  return `A receita ${verb} ${change} entre as janelas. O ${main.label.toLowerCase()} foi o que mais pesou: ${mainValue}.`
}
