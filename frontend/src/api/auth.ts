import type { TokenResponse, User } from '../types'
import { apiRequest } from './client'

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (payload: RegisterPayload) => apiRequest<User>('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload: LoginPayload) => apiRequest<TokenResponse>('/api/auth/login', { method: 'POST', body: payload }),
}
