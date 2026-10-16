import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'venergy_access_token'

/**
 * Obtém o token de autenticação JWT gravado no localStorage.
 *
 * @returns String contendo o token ou null se ausente/inacessível.
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Grava o token de autenticação JWT no localStorage.
 *
 * @param token - Token JWT a ser persistido.
 */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Falha ao salvar token no localStorage:', error)
  }
}

/**
 * Remove o token de autenticação JWT do localStorage.
 */
export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Falha ao remover token do localStorage:', error)
  }
}

/**
 * Verifica se o token JWT fornecido está expirado com base no campo exp.
 *
 * @param token - Token JWT para validação de expiração.
 * @returns Verdadeiro caso expirado ou inválido, falso caso ativo.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token)
    if (!decoded.exp) return false
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}
