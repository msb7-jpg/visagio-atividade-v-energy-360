import { createContext } from 'react'
import type { LoginRequest, TokenResponse } from '@/features/auth/api/authApi'
import type { UserDTO } from '@/features/auth/utils/user'

export interface AuthContextType {
  token: string | null
  user: UserDTO | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<TokenResponse>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
