import { trustedNaverLaunchUrl } from '../../api/naverAuthorizations'
import type { NaverAuthorization } from '../../types/naverAuthorization'

const windows = new Map<string, Window>()
export const NAVER_CALLBACK_PATH = '/settings/integrations/naver/callback'
export const NAVER_WINDOW_MESSAGE = 'united-ad:naver-authorization-updated'
export function naverAuthorizationPath(attemptId: string): string {
  return `${NAVER_CALLBACK_PATH}?attempt_id=${encodeURIComponent(attemptId)}`
}
export function openNaverWindow(): Window | null {
  // Called directly in the click handler before any async request.
  const popup = window.open('about:blank', '_blank', 'popup,width=560,height=760')
  if (popup) {
    popup.document.title = '네이버 연결 준비 중'
    popup.document.body.textContent = '네이버 연결 창을 준비하고 있습니다…'
  }
  return popup
}
export function launchNaverWindow(popup: Window, state: NaverAuthorization): void {
  if (!state.launchUrl) throw new Error('Missing launch URL')
  const url = trustedNaverLaunchUrl(state.launchUrl)
  if (popup.closed) throw new Error('Popup closed')
  windows.set(state.attemptId, popup)
  popup.location.replace(url)
}
export function getNaverWindow(attemptId: string): Window | undefined { return windows.get(attemptId) }
export function closeNaverWindow(attemptId: string): void {
  windows.get(attemptId)?.close()
  windows.delete(attemptId)
}
