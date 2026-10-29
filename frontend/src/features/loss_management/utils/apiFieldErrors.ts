import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'

export interface ValidationErrors {
  /** Mensagem em pt-BR por campo do corpo (`inspetor`, `data_inspecao`, `motivo_cancelamento`...). */
  fields: Partial<Record<string, string>>
  /** Mensagem que o servidor não ligou a nenhum campo. */
  general: string | null
}

interface ValidationIssue {
  loc?: unknown[]
  msg?: string
  type?: string
}

const UNPROCESSABLE_ENTITY = 422
const VALUE_ERROR_PREFIX = 'Value error, '
const FALLBACK_MESSAGE = 'Valor inválido.'
// O Pydantic escreve as mensagens padrão em inglês; as regras do próprio backend já vêm em pt-BR (`value_error`).
const MESSAGE_BY_ISSUE_TYPE: Record<string, string> = {
  missing: 'Campo obrigatório.',
  enum: 'Escolha uma das opções da lista.',
  date_parsing: 'Informe uma data válida.',
  date_from_datetime_parsing: 'Informe uma data válida.',
  date_type: 'Informe uma data válida.',
  bool_parsing: 'Escolha uma das opções.',
  float_parsing: 'Informe um número válido.',
  greater_than_equal: 'O valor não pode ser negativo.',
  string_too_long: 'Texto longo demais.'
}

function describeIssue(issue: ValidationIssue): string {
  if (issue.type === 'value_error' && issue.msg) {
    return issue.msg.startsWith(VALUE_ERROR_PREFIX) ? issue.msg.slice(VALUE_ERROR_PREFIX.length) : issue.msg
  }
  return MESSAGE_BY_ISSUE_TYPE[issue.type ?? ''] ?? FALLBACK_MESSAGE
}

function fieldOf(issue: ValidationIssue): string | null {
  const [origin, fieldName] = issue.loc ?? []
  return origin === 'body' && typeof fieldName === 'string' ? fieldName : null
}

export interface SubmitError {
  fields: ValidationErrors['fields']
  /** Mensagem para o rodapé do diálogo; nula quando todo o problema já está ao lado dos campos. */
  message: string | null
}

/**
 * Resume o erro de um envio para o diálogo: 422 vira mensagens por campo; qualquer outro erro vira a mensagem do rodapé.
 *
 * @param error - Erro lançado pela mutação, ou nulo se ela não falhou.
 * @returns Mensagens por campo e a do rodapé.
 */
export function describeSubmitError(error: unknown): SubmitError {
  if (error === null || error === undefined) return { fields: {}, message: null }
  const { fields, general } = parseValidationErrors(error)
  const hasValidationIssues = Object.keys(fields).length > 0 || general !== null
  return hasValidationIssues ? { fields, message: general } : { fields: {}, message: getApiErrorMessage(error) }
}

/**
 * Lê um 422 do FastAPI (`detail` em lista) e separa as mensagens por campo, já em pt-BR.
 *
 * @param error - Erro lançado pela mutação.
 * @returns Mensagens por campo e a sem campo; vazio quando o erro não é um 422 de validação.
 */
export function parseValidationErrors(error: unknown): ValidationErrors {
  const empty: ValidationErrors = { fields: {}, general: null }
  if (!isAxiosError<{ detail?: unknown }>(error) || error.response?.status !== UNPROCESSABLE_ENTITY) {
    return empty
  }
  const detail = error.response.data?.detail
  if (!Array.isArray(detail)) return empty
  return (detail as ValidationIssue[]).reduce<ValidationErrors>((collected, issue) => {
    const fieldName = fieldOf(issue)
    const message = describeIssue(issue)
    return fieldName
      ? { ...collected, fields: { ...collected.fields, [fieldName]: collected.fields[fieldName] ?? message } }
      : { ...collected, general: collected.general ?? message }
  }, empty)
}
