import { describe, expect, it } from 'vitest'
import { MIN_FIELD_SAMPLE, fieldSampleWarning } from '@/features/loss_management/utils/fieldResultsSample'

describe('fieldSampleWarning', () => {
  it('avisa quando há poucas ordens concluídas e diz quantas são', () => {
    expect(fieldSampleWarning(6)).toBe(
      'Só 6 ordens concluídas: com menos de 30, a taxa de acerto real ainda não tem significado e muda muito com uma ordem a mais.'
    )
  })

  it('usa o singular com uma única ordem', () => {
    expect(fieldSampleWarning(1)).toMatch(/^Só 1 ordem concluída:/)
  })

  it('avisa até uma ordem antes do mínimo e deixa de avisar a partir dele', () => {
    expect(fieldSampleWarning(MIN_FIELD_SAMPLE - 1)).not.toBeNull()
    expect(fieldSampleWarning(MIN_FIELD_SAMPLE)).toBeNull()
    expect(fieldSampleWarning(MIN_FIELD_SAMPLE + 100)).toBeNull()
  })

  it('não avisa sem nenhuma ordem concluída, porque a tela já diz que não há ordem', () => {
    expect(fieldSampleWarning(0)).toBeNull()
  })

  it('o mínimo é de 30 ordens concluídas', () => {
    expect(MIN_FIELD_SAMPLE).toBe(30)
  })
})
