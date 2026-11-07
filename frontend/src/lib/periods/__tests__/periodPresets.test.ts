import { describe, expect, it } from 'vitest'
import { baseFor, CASE_BASE, detectSelection, periodPresets, shiftMonth, validComparisons } from '@/lib/periods/periodPresets'

const AVAILABLE = { inicio: '2022-07', fim: '2026-06' }

describe('periodPresets', () => {
  it('oferece os últimos 12, 6 e 3 meses e só os anos completos que têm com o que comparar', () => {
    const presets = periodPresets(AVAILABLE)

    expect(presets.map((preset) => preset.id)).toEqual(['last12', 'last6', 'last3', 'year-2025', 'year-2024'])
    expect(presets[0].atual).toEqual({ inicio: '2025-07', fim: '2026-06' })
    expect(presets[2].atual).toEqual({ inicio: '2026-04', fim: '2026-06' })
  })
})

describe('baseFor', () => {
  const atual = { inicio: '2026-01', fim: '2026-06' }

  it('usa o primeiro ano da base do case', () => {
    expect(baseFor('case', atual)).toEqual(CASE_BASE)
  })

  it('volta 12 meses no mesmo período do ano anterior', () => {
    expect(baseFor('yoy', atual)).toEqual({ inicio: '2025-01', fim: '2025-06' })
  })

  it('pega o trecho de mesmo tamanho logo antes no período imediatamente anterior', () => {
    expect(baseFor('previous', atual)).toEqual({ inicio: '2025-07', fim: '2025-12' })
  })

  it('atravessa a virada do ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
  })
})

describe('detectSelection', () => {
  it('reconhece a pergunta do case', () => {
    const windows = { base: CASE_BASE, atual: { inicio: '2025-07', fim: '2026-06' } }

    expect(detectSelection(windows, AVAILABLE)).toEqual({ preset: 'last12', comparison: 'case' })
  })

  it('marca como personalizado o que nenhum atalho produz', () => {
    const windows = { base: { inicio: '2022-08', fim: '2023-02' }, atual: { inicio: '2025-08', fim: '2026-05' } }

    expect(detectSelection(windows, AVAILABLE)).toEqual({ preset: 'custom', comparison: 'custom' })
  })
})

describe('validComparisons', () => {
  it('não oferece base que se sobrepõe ao período nem que começa antes dos dados', () => {
    expect(validComparisons({ inicio: '2023-01', fim: '2023-12' }, AVAILABLE)).toEqual([])
    expect(validComparisons({ inicio: '2024-01', fim: '2024-12' }, AVAILABLE)).toEqual(['case', 'yoy', 'previous'])
    expect(validComparisons({ inicio: '2023-07', fim: '2024-06' }, AVAILABLE)).toEqual(['case', 'yoy', 'previous'])
  })
})
