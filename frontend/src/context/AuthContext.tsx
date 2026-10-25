import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth'
import { tokenStore } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** A session needs both the token and the user saved at login; anything else is discarded. */
function restoreSession(): User | null {
  const token = tokenStore.get()
  const user = tokenStore.getUser()
  if (token && user) return user
  if (token || user) tokenStore.clear()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restoreSession)

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Any 401 from the API (e.g. an expired token) signs the user out.
  useEffect(() => tokenStore.onUnauthorized(logout), [logout])

  const login = useCallback(async (payload: LoginPayload) => {
    const { access_token, user: loggedIn } = await authApi.login(payload)
    tokenStore.set(access_token)
    tokenStore.setUser(loggedIn)
    setUser(loggedIn)
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload)
      await login({ email: payload.email, password: payload.password })
    },
    [login],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
