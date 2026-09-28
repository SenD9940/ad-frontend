import type { SupportGrant } from '../admin/types'
const KEY = 'unitedAd.support.session'
export const SUPPORT_EVENT = 'unitedAd.support.changed'
export function localTime(value: string) { return Date.parse(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}+09:00`) }
export function readSupportSession(): SupportGrant | null {
  try { const value = JSON.parse(sessionStorage.getItem(KEY) || 'null') as SupportGrant | null; return value?.accessToken && Number.isSafeInteger(value.workspaceId) && Number.isSafeInteger(value.ticketId) ? value : null } catch { return null }
}
export function startSupportSession(value: SupportGrant) { sessionStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new Event(SUPPORT_EVENT)) }
export function clearSupportSession() { sessionStorage.removeItem(KEY); window.dispatchEvent(new Event(SUPPORT_EVENT)) }
export function supportExpired(value: SupportGrant) { return !(localTime(value.expiresAt) > Date.now()) }
