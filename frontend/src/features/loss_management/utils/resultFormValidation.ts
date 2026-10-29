export interface FieldResultForm {
  irregularidade: '' | 'sim' | 'nao'
  tipo: string
  kwh: string
  toi: string
  /** Código do inspetor (INSP-001 a INSP-040), escolhido na lista da API. */
  inspetor: string
  /** Data da inspeção no formato AAAA-MM-DD (valor do campo de data). */
  data: string
}

export type FieldResultErrors = Partial<Record<'irregularidade' | 'tipo' | 'kwh' | 'inspetor' | 'data', string>>

export const EMPTY_RESULT_FORM: FieldResultForm = { irregularidade: '', tipo: '', kwh: '', toi: '', inspetor: '', data: '' }

const THOUSANDS_GROUPED = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/
const PLAIN_DECIMAL = /^-?\d+([.,]\d+)?$/
const DATE_PART_WIDTH = 2

/**
 * Data de hoje (fuso do navegador) no formato AAAA-MM-DD, o limite máximo da data da inspeção.
 * O servidor compara com a data UTC, que nunca é anterior à local no Brasil; se divergir, o 422 aparece no campo.
 *
 * @param now - Instante de referência (injetável nos testes).
 * @returns Data como "2026-10-28".
 */
export function todayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(DATE_PART_WIDTH, '0')
  const day = String(now.getDate()).padStart(DATE_PART_WIDTH, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

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

function validateVisit(form: FieldResultForm, today: string): FieldResultErrors {
  const dateError = form.data === '' ? 'Informe a data da inspeção.' : 'A data da inspeção não pode ser futura.'
  const isDateValid = form.data !== '' && form.data <= today
  return {
    ...(form.inspetor === '' ? { inspetor: 'Selecione o inspetor.' } : {}),
    ...(isDateValid ? {} : { data: dateError })
  }
}

function validateOutcome(form: FieldResultForm): FieldResultErrors {
  if (form.irregularidade === '') {
    return { irregularidade: 'Informe se houve irregularidade.' }
  }
  if (form.irregularidade === 'nao') {
    return {}
  }
  return {
    ...(form.tipo === '' ? { tipo: 'Informe o tipo de irregularidade.' } : {}),
    ...(parseKwh(form.kwh) > 0 ? {} : { kwh: 'Informe o kWh recuperado (número maior que zero).' })
  }
}

/**
 * Valida o formulário de resultado de campo. Inspetor, data (não futura) e resultado são sempre obrigatórios;
 * com irregularidade, tipo e kWh maior que zero também.
 *
 * @param form - Valores digitados.
 * @param today - Data de hoje (AAAA-MM-DD); injetável nos testes.
 * @returns Mensagem de erro por campo; objeto vazio quando válido.
 */
export function validateResultForm(form: FieldResultForm, today: string = todayIsoDate()): FieldResultErrors {
  return { ...validateVisit(form, today), ...validateOutcome(form) }
}
