import { describe, expect, it } from 'vitest'
import {
  EMPTY_RESULT_FORM,
  parseKwh,
  todayIsoDate,
  validateResultForm,
  type FieldResultForm
} from '@/features/loss_management/utils/resultFormValidation'

const TODAY = '2026-10-28'
const VISIT: Pick<FieldResultForm, 'inspetor' | 'data'> = { inspetor: 'INSP-014', data: '2026-10-27' }
const VALID_BASE: FieldResultForm = { ...EMPTY_RESULT_FORM, ...VISIT }

describe('validateResultForm', () => {
  it('exige inspetor, data e resultado em um formulário vazio, todos de uma vez', () => {
    expect(validateResultForm(EMPTY_RESULT_FORM, TODAY)).toEqual({
      inspetor: 'Selecione o inspetor.',
      data: 'Informe a data da inspeção.',
      irregularidade: 'Informe se houve irregularidade.'
    })
  })

  it('exige informar se houve irregularidade', () => {
    expect(validateResultForm(VALID_BASE, TODAY)).toEqual({ irregularidade: 'Informe se houve irregularidade.' })
  })

  it('exige o inspetor mesmo com o resto preenchido', () => {
    const errors = validateResultForm({ ...VALID_BASE, inspetor: '', irregularidade: 'nao' }, TODAY)

    expect(errors).toEqual({ inspetor: 'Selecione o inspetor.' })
  })

  it('bloqueia data futura', () => {
    const errors = validateResultForm({ ...VALID_BASE, data: '2026-10-29', irregularidade: 'nao' }, TODAY)

    expect(errors).toEqual({ data: 'A data da inspeção não pode ser futura.' })
  })

  it('aceita a data de hoje', () => {
    expect(validateResultForm({ ...VALID_BASE, data: TODAY, irregularidade: 'nao' }, TODAY)).toEqual({})
  })

  it('aceita "não" sem tipo nem kWh', () => {
    expect(validateResultForm({ ...VALID_BASE, irregularidade: 'nao' }, TODAY)).toEqual({})
  })

  it('com irregularidade, exige tipo e kWh', () => {
    const errors = validateResultForm({ ...VALID_BASE, irregularidade: 'sim' }, TODAY)

    expect(errors.tipo).toBeDefined()
    expect(errors.kwh).toBeDefined()
  })

  it('rejeita kWh zero ou negativo', () => {
    const base = { ...VALID_BASE, irregularidade: 'sim' as const, tipo: 'BY-PASS' }

    expect(validateResultForm({ ...base, kwh: '0' }, TODAY).kwh).toBeDefined()
    expect(validateResultForm({ ...base, kwh: '-5' }, TODAY).kwh).toBeDefined()
  })

  it('aceita irregularidade com tipo e kWh maior que zero (vírgula decimal)', () => {
    const form = { ...VALID_BASE, irregularidade: 'sim' as const, tipo: 'BY-PASS', kwh: '860,5' }

    expect(validateResultForm(form, TODAY)).toEqual({})
    expect(parseKwh('860,5')).toBe(860.5)
  })

  it('usa a mensagem do protótipo quando o kWh é inválido', () => {
    const form = { ...VALID_BASE, irregularidade: 'sim' as const, tipo: 'BY-PASS', kwh: 'abc' }

    expect(validateResultForm(form, TODAY).kwh).toBe('Informe o kWh recuperado (número maior que zero).')
  })
})

describe('todayIsoDate', () => {
  it('formata a data local com zeros à esquerda', () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('parseKwh', () => {
  it.each([
    ['1.240', 1240],
    ['1240,5', 1240.5],
    ['1.240,5', 1240.5],
    ['1.240.000', 1_240_000],
    ['1240.5', 1240.5],
    ['1240', 1240],
    [' 860,5 ', 860.5],
    ['-5', -5]
  ])('converte "%s" em %s', (text, expected) => {
    expect(parseKwh(text)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '1,2,3', '1.2.3', '12,', ',5', '1e3'])('rejeita "%s"', (text) => {
    expect(parseKwh(text)).toBeNaN()
  })
})
