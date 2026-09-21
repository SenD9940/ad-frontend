import type { TokenResponse } from '../types/token'

const ACCESS_TOKEN_KEY = 'unitedAd.accessToken'
const REFRESH_TOKEN_KEY = 'unitedAd.refreshToken'

type SessionListener = (isLoggedIn: boolean) => void

const listeners = new Set<SessionListener>()

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifySession(isLoggedIn: boolean) {
  listeners.forEach((listener) => listener(isLoggedIn))
}

export function readAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function readRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveTokens(tokens: TokenResponse): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  notifySession(true)
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  notifySession(false)
}
