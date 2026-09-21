import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearTokens, readAccessToken, saveTokens, subscribeSession } from './session'
import { AuthContext, type AuthContextValue } from './AuthContext'

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
