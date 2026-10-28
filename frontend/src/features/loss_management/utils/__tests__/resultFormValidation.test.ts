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
})
