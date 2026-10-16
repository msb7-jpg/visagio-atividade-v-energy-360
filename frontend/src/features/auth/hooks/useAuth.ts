import { use } from 'react'
import { AuthContext, type AuthContextType } from '@/features/auth/context/AuthContext'

/**
 * Hook para acessar o contexto de autenticação e dados do usuário logado.
 *
 * @returns Instância do contexto AuthContextType com métodos de autenticação.
 */
export function useAuth(): AuthContextType {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>')
  }
  return context
}
