import { isAxiosError } from 'axios'

/**
 * Converte o corpo de erro lido como `Blob` em JSON, para `getApiErrorMessage` achar o `detail`.
 *
 * Requisições com `responseType: 'blob'` devolvem também o corpo dos erros como `Blob`.
 *
 * @param error - Erro lançado pela requisição.
 * @returns O mesmo erro, com `response.data` já convertido quando o corpo era JSON.
 */
export async function parseBlobErrorBody(error: unknown): Promise<unknown> {
  if (!isAxiosError(error) || !(error.response?.data instanceof Blob)) {
    return error
  }
  try {
    error.response.data = JSON.parse(await error.response.data.text())
  } catch {
    // Corpo que não é JSON: mantém o erro original, que cai na mensagem genérica.
  }
  return error
}
