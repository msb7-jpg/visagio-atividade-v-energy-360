import { describe, expect, it } from 'vitest'
import { dateToMonth, monthToDate } from '@/features/revenue/utils/revenueDates'

describe('monthToDate', () => {
  it('usa o dia 1 para o início do período', () => {
    expect(monthToDate('2022-07', 'inicio')).toBe('2022-07-01')
  })

  it('usa o último dia do mês para o fim do período', () => {
    expect(monthToDate('2023-06', 'fim')).toBe('2023-06-30')
    expect(monthToDate('2025-07', 'fim')).toBe('2025-07-31')
  })

  it('respeita fevereiro, inclusive em ano bissexto', () => {
    expect(monthToDate('2026-02', 'fim')).toBe('2026-02-28')
    expect(monthToDate('2024-02', 'fim')).toBe('2024-02-29')
  })
})

describe('dateToMonth', () => {
  it('reduz qualquer dia à competência do mês', () => {
    expect(dateToMonth('2026-11-11')).toBe('2026-11')
  })

  it('devolve texto vazio quando o campo é limpo', () => {
    expect(dateToMonth('')).toBe('')
  })
})
