import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearTokens, readAccessToken, saveTokens, subscribeSession } from './session'
import type { TokenResponse } from '../types/token'

type AuthContextValue = {
  isLoggedIn: boolean
  setSession: (tokens: TokenResponse) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(readAccessToken()))

  useEffect(() => subscribeSession(setIsLoggedIn), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      setSession: saveTokens,
      clearSession: clearTokens,
    }),
    [isLoggedIn],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
