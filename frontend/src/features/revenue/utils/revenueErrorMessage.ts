import { isAxiosError } from 'axios'

const GENERIC_ERROR_MESSAGE = 'Não foi possível carregar os dados de receita. Tente novamente.'

/**
 * Extrai a mensagem de negócio devolvida pela API (`detail`), com texto genérico como alternativa.
 *
 * @param error - Erro lançado pela query.
 * @returns Mensagem do backend (ex.: sem faturamento para o recorte) ou texto genérico.
 */
export function getRevenueErrorMessage(error: unknown): string {
  if (!isAxiosError<{ detail?: unknown }>(error)) {
    return GENERIC_ERROR_MESSAGE
  }
  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : GENERIC_ERROR_MESSAGE
}
