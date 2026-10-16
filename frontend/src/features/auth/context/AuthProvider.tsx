import { useSyncExternalStore, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { authApi, type LoginRequest, type TokenResponse } from '@/features/auth/api/authApi'
import { AuthContext } from '@/features/auth/context/AuthContext'
import {
  getStoredToken,
  isTokenExpired,
  removeStoredToken,
  setStoredToken
} from '@/features/auth/utils/token'
import { extractUserFromToken } from '@/features/auth/utils/user'

const authListeners = new Set<() => void>()

function subscribeAuthStore(onStoreChange: () => void) {
  authListeners.add(onStoreChange)
  const handleStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key === 'venergy_access_token') {
      onStoreChange()
    }
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    authListeners.delete(onStoreChange)
    window.removeEventListener('storage', handleStorage)
  }
}

function notifyAuthStore() {
  authListeners.forEach((listener) => listener())
}

/**
 * Provedor de contexto de autenticação com sincronização via external store.
 *
 * @param props - Propriedades contendo os componentes filhos (children).
 * @returns Elemento AuthProvider renderizado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    subscribeAuthStore,
    getStoredToken,
    () => null
  )

  const user = extractUserFromToken(token)
  const isAuthenticated = Boolean(token && !isTokenExpired(token) && user)

  const loginMutation = useMutation<TokenResponse, Error, LoginRequest>(
    {
      mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
      onSuccess: (response) => {
        setStoredToken(response.access_token)
        notifyAuthStore()
      }
    },
    queryClient
  )

  const logout = () => {
    removeStoredToken()
    notifyAuthStore()
    queryClient.clear()
    window.location.assign('/login')
  }

  return (
    <AuthContext
      value={{
        token,
        user,
        isAuthenticated,
        isLoading: loginMutation.isPending,
        login: loginMutation.mutateAsync,
        logout
      }}
    >
      {children}
    </AuthContext>
  )
}
