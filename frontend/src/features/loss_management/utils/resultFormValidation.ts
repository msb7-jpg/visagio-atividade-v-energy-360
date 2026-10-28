export interface FieldResultForm {
  irregularidade: '' | 'sim' | 'nao'
  tipo: string
  kwh: string
  toi: string
}

export type FieldResultErrors = Partial<Record<'irregularidade' | 'tipo' | 'kwh', string>>

export const EMPTY_RESULT_FORM: FieldResultForm = { irregularidade: '', tipo: '', kwh: '', toi: '' }

const THOUSANDS_GROUPED = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/
const PLAIN_DECIMAL = /^-?\d+([.,]\d+)?$/

/**
 * Converte o texto de kWh digitado em número. Aceita "1240", "1240,5", "1240.5" e "1.240" (milhar com ponto).
 *
 * @param kwhText - Texto do campo.
 * @returns Número, ou NaN se o texto estiver vazio ou inválido.
 */
export function parseKwh(kwhText: string): number {
  const trimmedText = kwhText.trim()
  if (THOUSANDS_GROUPED.test(trimmedText)) {
    return Number(trimmedText.replaceAll('.', '').replace(',', '.'))
  }
  return PLAIN_DECIMAL.test(trimmedText) ? Number(trimmedText.replace(',', '.')) : Number.NaN
}

/**
 * Valida o formulário de resultado de campo: com irregularidade, tipo e kWh maior que zero são obrigatórios.
 *
 * @param form - Valores digitados.
 * @returns Mensagem de erro por campo; objeto vazio quando válido.
 */
export function validateResultForm(form: FieldResultForm): FieldResultErrors {
  if (form.irregularidade === '') {
    return { irregularidade: 'Informe se houve irregularidade.' }
  }
  if (form.irregularidade === 'nao') {
    return {}
  }
  const kwhRecovered = parseKwh(form.kwh)
  return {
    ...(form.tipo === '' ? { tipo: 'Informe o tipo de irregularidade.' } : {}),
    ...(kwhRecovered > 0 ? {} : { kwh: 'Informe o kWh recuperado (número maior que zero).' })
  }
}
