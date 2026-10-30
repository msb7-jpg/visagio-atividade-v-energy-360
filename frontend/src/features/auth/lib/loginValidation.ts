import { isAxiosError } from 'axios'
import { ALLOWED_EMAIL_DOMAIN } from '@/features/auth/lib/loginConfig'

export interface LoginFieldError {
  field: 'email' | 'senha'
  message: string
}

const EMAIL_PATTERN = new RegExp(`^[^@\\s]+@${ALLOWED_EMAIL_DOMAIN.replace('.', '\\.')}$`)

/**
 * Valida os campos antes de chamar a API: e-mail corporativo e senha preenchida.
 *
 * @param email - E-mail digitado.
 * @param senha - Senha digitada.
 * @returns O primeiro erro encontrado, ou `null` se os dados estão válidos.
 */
export function validateLogin(email: string, senha: string): LoginFieldError | null {
  if (!EMAIL_PATTERN.test(email.trim().toLowerCase())) {
    return { field: 'email', message: `Use o seu e-mail corporativo @${ALLOWED_EMAIL_DOMAIN}.` }
  }
  if (!senha) {
    return { field: 'senha', message: 'Informe a senha.' }
  }
  return null
}

/**
 * Traduz a falha do login em mensagem para o usuário.
 *
 * @param error - Erro lançado pela mutation de login.
 * @returns Mensagem em português, sem detalhes técnicos.
 */
export function loginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'E-mail ou senha incorretos.'
    if (!error.response) return 'Não foi possível falar com o servidor. Tente de novo.'
  }
  return 'Falha ao autenticar. Tente de novo.'
}
