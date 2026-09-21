import { createContext, useContext } from 'react'
import type { TokenResponse } from '../types/token'

export type AuthContextValue = {
  isLoggedIn: boolean
  setSession: (tokens: TokenResponse) => void
  clearSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
