import { describe, expect, it } from 'vitest'
import { EMPTY_RESULT_FORM, parseKwh, validateResultForm } from '@/features/loss_management/utils/resultFormValidation'

describe('validateResultForm', () => {
  it('exige informar se houve irregularidade', () => {
    expect(validateResultForm(EMPTY_RESULT_FORM)).toEqual({ irregularidade: 'Informe se houve irregularidade.' })
  })

  it('aceita "não" sem tipo nem kWh', () => {
    expect(validateResultForm({ ...EMPTY_RESULT_FORM, irregularidade: 'nao' })).toEqual({})
  })

  it('com irregularidade, exige tipo e kWh', () => {
    const errors = validateResultForm({ ...EMPTY_RESULT_FORM, irregularidade: 'sim' })

    expect(errors.tipo).toBeDefined()
    expect(errors.kwh).toBeDefined()
  })

  it('rejeita kWh zero ou negativo', () => {
    const base = { ...EMPTY_RESULT_FORM, irregularidade: 'sim' as const, tipo: 'BY-PASS' }

    expect(validateResultForm({ ...base, kwh: '0' }).kwh).toBeDefined()
    expect(validateResultForm({ ...base, kwh: '-5' }).kwh).toBeDefined()
  })

  it('aceita irregularidade com tipo e kWh maior que zero (vírgula decimal)', () => {
    const form = { ...EMPTY_RESULT_FORM, irregularidade: 'sim' as const, tipo: 'BY-PASS', kwh: '860,5' }

    expect(validateResultForm(form)).toEqual({})
    expect(parseKwh('860,5')).toBe(860.5)
  })

  it('usa a mensagem do protótipo quando o kWh é inválido', () => {
    const form = { ...EMPTY_RESULT_FORM, irregularidade: 'sim' as const, tipo: 'BY-PASS', kwh: 'abc' }

    expect(validateResultForm(form).kwh).toBe('Informe o kWh recuperado (número maior que zero).')
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
