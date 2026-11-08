import { describe, expect, it } from 'vitest'
import { formatMultiple } from '@/features/loss_management/utils/backtestFormat'

describe('formatMultiple', () => {
  it.each([
    [3.186, '3,2×'],
    [1, '1,0×'],
    [0.45, '0,5×'],
    [12.04, '12,0×']
  ])('escreve %s como %s, com uma casa e vírgula decimal', (ratio, expected) => {
    expect(formatMultiple(ratio)).toBe(expected)
  })
})
