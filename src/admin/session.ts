import type { AdminUser } from './types'

const KEY = 'unitedAd.admin.session'
export const ADMIN_SESSION_EVENT = 'unitedAd.admin.sessionChanged'
export type AdminSession = { accessToken: string; expiresAt: string; user: AdminUser }
export function readAdminSession(): AdminSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null') as AdminSession | null
    return value?.accessToken && value.user?.role === 'ADMIN' && Date.parse(value.expiresAt) > Date.now() ? value : null
  } catch { return null }
}
export function saveAdminSession(value: AdminSession) {
  sessionStorage.setItem(KEY, JSON.stringify(value))
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT))
}
export function clearAdminSession() {
  sessionStorage.removeItem(KEY)
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT))
}
