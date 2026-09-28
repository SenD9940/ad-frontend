import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/http'
import { getNaverCapabilities, startNaverAuthorization } from '../api/naverAuthorizations'
import type { NaverCapabilities } from '../types/naverAuthorization'
import { launchNaverWindow, naverAuthorizationPath, openNaverWindow } from '../pages/workspace/naverAuthorizationWindow'

export function useNaverAuthorizationEntry(workspaceId: number, isOwner: boolean) {
  const navigate = useNavigate()
  const [capabilities, setCapabilities] = useState<NaverCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startError, setStartError] = useState('')
  const [starting, setStarting] = useState(false)
  const [version, setVersion] = useState(0)
  const active = useRef(false)
  const startingRef = useRef(false)
  useEffect(() => {
    active.current = true
    const controller = new AbortController()
    void getNaverCapabilities(workspaceId, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setCapabilities(value); setError('') }
    }).catch((caught) => {
      if (!controller.signal.aborted) { setCapabilities(null); setError(caught instanceof ApiError ? caught.message : '연결 방식을 확인하지 못했습니다.') }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { active.current = false; controller.abort() }
  }, [workspaceId, version])

  const reload = useCallback(() => { setLoading(true); setError(''); setVersion((value) => value + 1) }, [])
  async function start(reconnectConnectionId?: number, marketplaceReceipt?: string) {
    if (!isOwner || !capabilities?.ready || startingRef.current) return
    const popup = openNaverWindow()
    if (!popup) { setStartError('팝업이 차단되었습니다. 이 사이트의 팝업을 허용하고 다시 눌러 주세요.'); return }
    startingRef.current = true
    setStarting(true)
    setStartError('')
    try {
      const state = await startNaverAuthorization(workspaceId, { reconnectConnectionId, marketplaceReceipt })
      if (!active.current) { popup.close(); return }
      // Even when the user closes the window during the request, keep the
      // server-created attempt reachable and allow a new launch ticket there.
      try { launchNaverWindow(popup, state) } catch { popup.close() }
      navigate(naverAuthorizationPath(state.attemptId))
    } catch (caught) {
      popup.close()
      if (active.current) setStartError(caught instanceof ApiError ? caught.message : '네이버 연결을 시작하지 못했습니다.')
    } finally {
      startingRef.current = false
      if (active.current) setStarting(false)
    }
  }
  return { capabilities, loading, error, startError, starting, reload, start }
}
