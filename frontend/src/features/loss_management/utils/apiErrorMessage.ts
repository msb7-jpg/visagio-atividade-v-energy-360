import { isAxiosError } from 'axios'

const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Extrai a mensagem de erro de negócio devolvida pela API (`detail`).
 *
 * @param error - Erro lançado pela mutação ou query.
 * @returns Mensagem do backend ou texto genérico.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError<{ detail?: unknown }>(error)) {
    return GENERIC_ERROR_MESSAGE
  }
  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : GENERIC_ERROR_MESSAGE
}
