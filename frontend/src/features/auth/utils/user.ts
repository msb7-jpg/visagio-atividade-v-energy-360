import { jwtDecode } from 'jwt-decode'

export interface UserDTO {
  id: string
  email: string
  nome: string
  role: string
}

interface JwtCustomPayload {
  sub: string
  email: string
  nome: string
  role: string
}

/**
 * Decodifica o payload do token JWT e extrai os dados estruturados do usuário.
 *
 * @param token - Token JWT codificado ou null.
 * @returns Objeto UserDTO com identificador, nome, e-mail e cargo, ou null se inválido.
 */
export function extractUserFromToken(token: string | null): UserDTO | null {
  if (!token) return null

  try {
    const payload = jwtDecode<JwtCustomPayload>(token)
    if (!payload.sub || !payload.email || !payload.role) {
      return null
    }

    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome || 'Usuário V-Energy',
      role: payload.role
    }
  } catch {
    return null
  }
}
