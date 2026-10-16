import { apiClient } from '@/lib/api-client'
import type { UserDTO } from '@/features/auth/utils/user'

export interface LoginRequest {
  email: string
  senha: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: UserDTO
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials)
    return data
  },

  async getMe(): Promise<UserDTO> {
    const { data } = await apiClient.get<UserDTO>('/auth/me')
    return data
  }
}
