export interface FieldResultForm {
  irregularidade: '' | 'sim' | 'nao'
  tipo: string
  kwh: string
  toi: string
}

export type FieldResultErrors = Partial<Record<'irregularidade' | 'tipo' | 'kwh', string>>

export const EMPTY_RESULT_FORM: FieldResultForm = { irregularidade: '', tipo: '', kwh: '', toi: '' }

/**
 * Converte o texto de kWh digitado (aceita vírgula decimal) em número.
 *
 * @param kwhText - Texto do campo.
 * @returns Número, ou NaN se o texto estiver vazio ou inválido.
 */
export function parseKwh(kwhText: string): number {
  const normalizedText = kwhText.trim().replace(',', '.')
  return normalizedText === '' ? Number.NaN : Number(normalizedText)
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
    ...(kwhRecovered > 0 ? {} : { kwh: 'Informe um kWh recuperado maior que zero.' })
  }
}
