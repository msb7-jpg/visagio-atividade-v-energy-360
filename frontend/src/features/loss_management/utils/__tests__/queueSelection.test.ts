import { describe, expect, it } from 'vitest'
import { MAX_SELECTION_COUNT, parsePositiveInt } from '@/features/loss_management/utils/queueSelection'

describe('parsePositiveInt', () => {
  it('aceita inteiros a partir de 1', () => {
    expect(parsePositiveInt('10')).toBe(10)
    expect(parsePositiveInt(' 200 ')).toBe(200)
  })

  it.each([[''], ['0'], ['-3'], ['2,5'], ['abc'], ['9'.repeat(400)]])('recusa "%s"', (text) => {
    expect(parsePositiveInt(text)).toBeNull()
  })

  it('o máximo marcado por vez espelha o limite de UCs que o resumo da seleção aceita no servidor', () => {
    expect(MAX_SELECTION_COUNT).toBe(400)
  })
})
