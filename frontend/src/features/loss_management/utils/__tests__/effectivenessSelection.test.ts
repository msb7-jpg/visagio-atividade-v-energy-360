import { describe, expect, it } from 'vitest'
import type { Backtest, BacktestSize } from '@/features/loss_management/types/backtestTypes'
import { pickCutoff, pickSize, resultsBySize } from '@/features/loss_management/utils/effectivenessSelection'

function result(cutoff: string | null, size: number): Backtest {
  return { data_corte: cutoff, n_solicitado: size } as Backtest
}

const SIZES: BacktestSize[] = [
  { tamanho: 50, cortes: [result('2025-07', 50), result('2025-08', 50)] },
  { tamanho: 200, cortes: [result('2025-07', 200)] }
]

describe('pickSize', () => {
  it('usa o tamanho escolhido', () => {
    expect(pickSize(SIZES, 50, 200)?.tamanho).toBe(50)
  })

  it('cai no padrão enquanto ninguém escolheu ou se o escolhido sumiu da série', () => {
    expect(pickSize(SIZES, null, 200)?.tamanho).toBe(200)
    expect(pickSize(SIZES, 999, 200)?.tamanho).toBe(200)
  })

  it('não inventa um tamanho quando nada foi medido', () => {
    expect(pickSize([], null, 200)).toBeUndefined()
  })
})

describe('pickCutoff', () => {
  const results = [result('2025-07', 200), result('2025-08', 200)]

  it('usa o corte escolhido', () => {
    expect(pickCutoff(results, '2025-08')?.data_corte).toBe('2025-08')
  })

  it('cai no corte mais antigo enquanto ninguém escolheu ou se o escolhido sumiu da série', () => {
    expect(pickCutoff(results, null)?.data_corte).toBe('2025-07')
    expect(pickCutoff(results, '2024-01')?.data_corte).toBe('2025-07')
  })

  it('não casa a falta de escolha com um resultado sem corte', () => {
    expect(pickCutoff([result(null, 200)], null)?.data_corte).toBeNull()
  })

  it('devolve nulo sem cortes', () => {
    expect(pickCutoff([], '2025-07')).toBeNull()
  })
})

describe('resultsBySize', () => {
  it('traz o corte em cada tamanho, na ordem dos tamanhos', () => {
    expect(resultsBySize(SIZES, '2025-07').map((entry) => [entry.tamanho, entry.result.n_solicitado])).toEqual([
      [50, 50],
      [200, 200]
    ])
  })

  it('pula o tamanho que não tem esse corte', () => {
    expect(resultsBySize(SIZES, '2025-08').map((entry) => entry.tamanho)).toEqual([50])
  })
})
