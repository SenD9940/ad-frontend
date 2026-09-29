import { useCallback, useEffect, useRef, useState } from 'react'
import { useModal } from '../components/common/useModal'
import { useErrorModal } from '../components/common/useErrorModal'
import { ApiError } from '../api/http'
import { cancelNaverAuthorization, completeNaverAuthorization, getNaverAuthorization, NaverAuthorizationError, reissueNaverAuthorization } from '../api/naverAuthorizations'
import type { NaverAuthorization } from '../types/naverAuthorization'
import { closeNaverWindow, getNaverWindow, launchNaverWindow, NAVER_WINDOW_MESSAGE, openNaverWindow } from '../pages/workspace/naverAuthorizationWindow'

const FINAL = new Set(['CONNECTED', 'FAILED', 'CANCELLED', 'EXPIRED'])
const POLLED = new Set(['WAITING_AUTH', 'VALIDATING', 'APPROVING', 'RECONCILING', 'VERIFYING_CONNECTION'])
export function useNaverAuthorization(attemptId: string) {
  const modal = useModal()
  const [state, setState] = useState<NaverAuthorization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authRequired, setAuthRequired] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unknown, setUnknown] = useState(false)
  const [paused, setPaused] = useState(false)
  useErrorModal(error, '네이버 연결 상태 확인 필요', paused || authRequired)
  const [popupClosed, setPopupClosed] = useState(false)
  const active = useRef(false)
  const current = useRef<NaverAuthorization | null>(null)
  const mutation = useRef(false)
  const readRequest = useRef<AbortController | null>(null)
  const readVersion = useRef(0)
  const keys = useRef(new Map<number, string>())
  const pollCount = useRef(0)
  const pollFailures = useRef(0)
  const forbidden = useRef(false)

  const adopt = useCallback((next: NaverAuthorization, preserveError = false) => {
    current.current = next
    setState(next)
    setUnknown(false)
    if (!preserveError) setError('')
    setAuthRequired(false)
    if (FINAL.has(next.status)) closeNaverWindow(attemptId)
  }, [attemptId])

  const refresh = useCallback(async (preserveError = false): Promise<boolean> => {
    if (!active.current || mutation.current) return false
    readRequest.current?.abort()
    const controller = new AbortController()
    const version = ++readVersion.current
    readRequest.current = controller
    try {
      const next = await getNaverAuthorization(attemptId, controller.signal)
      if (!active.current || controller.signal.aborted || version !== readVersion.current) return false
      const sameStage = current.current?.status === next.status && current.current.reviewRevision === next.reviewRevision
      adopt(next, preserveError && sameStage)
      pollFailures.current = 0
      return true
    } catch (caught) {
      if (!active.current || controller.signal.aborted || version !== readVersion.current) return false
      pollFailures.current += 1
      setError(caught instanceof ApiError ? caught.message : '연결 상태를 조회하지 못했습니다.')
      if (caught instanceof ApiError && caught.status === 401) { setAuthRequired(true); setPaused(true); forbidden.current = true }
      if (caught instanceof ApiError && [403, 404].includes(caught.status ?? 0)) { current.current = null; setState(null); setPaused(true); forbidden.current = true }
      return false
    } finally {
      if (active.current && version === readVersion.current) setLoading(false)
    }
  }, [adopt, attemptId])

  useEffect(() => {
    active.current = true
    const initialRead = setTimeout(() => { void refresh() }, 0)
    let timer: ReturnType<typeof setTimeout>
    function schedule() {
      const delay = Math.min(15_000, 2_000 * (2 ** Math.min(pollFailures.current, 3)))
      timer = setTimeout(async () => {
        if (!active.current || forbidden.current) return
        if (document.visibilityState === 'visible' && !mutation.current && (!current.current || POLLED.has(current.current.status))) {
          if (pollCount.current >= 60 || pollFailures.current >= 4) { setPaused(true); return }
          pollCount.current += 1
          await refresh()
        }
        if (!current.current || !FINAL.has(current.current.status)) schedule()
      }, delay)
    }
    schedule()
    function message(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== getNaverWindow(attemptId)
        || !event.data || event.data.type !== NAVER_WINDOW_MESSAGE || event.data.attemptId !== attemptId) return
      void refresh()
    }
    function visibility() { if (!forbidden.current && document.visibilityState === 'visible' && pollCount.current < 60 && pollFailures.current < 4) void refresh() }
    window.addEventListener('message', message)
    document.addEventListener('visibilitychange', visibility)
    const closedTimer = setInterval(() => {
      const popup = getNaverWindow(attemptId)
      if (popup?.closed && current.current?.status === 'WAITING_AUTH') setPopupClosed(true)
    }, 1_000)
    return () => {
      active.current = false
      readVersion.current += 1
      readRequest.current?.abort()
      clearTimeout(initialRead)
      clearTimeout(timer)
      clearInterval(closedTimer)
      window.removeEventListener('message', message)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [attemptId, refresh])

  async function mutate(action: 'complete' | 'cancel' | 'reopen') {
    const target = current.current
    if (!target || mutation.current || !active.current || (unknown && action === 'complete')) return
    let popup: Window | null = null
    if (action === 'reopen') {
      popup = openNaverWindow()
      if (!popup) { const message = '팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.'; setError(message); void modal.info({ title: '팝업 허용이 필요합니다', message }); return }
    }
    mutation.current = true
    readVersion.current += 1
    readRequest.current?.abort()
    setBusy(true)
    setError('')
    try {
      let next: NaverAuthorization
      if (action === 'complete') {
        const revision = target.reviewRevision!
        if (!keys.current.has(revision)) keys.current.set(revision, completionKey(attemptId, revision))
        next = await completeNaverAuthorization(target, keys.current.get(revision)!)
      } else if (action === 'cancel') next = await cancelNaverAuthorization(target)
      else next = await reissueNaverAuthorization(target)
      if (!active.current) { popup?.close(); return }
      adopt(next)
      if (popup) { launchNaverWindow(popup, next); setPopupClosed(false) }
    } catch (caught) {
      popup?.close()
      if (!active.current) return
      const message = caught instanceof ApiError ? caught.message : '요청 결과를 확인할 수 없습니다. 연결 상태를 조회해 주세요.'
      setError(message)
      if (!(caught instanceof ApiError && caught.status === 401)) void modal.error({ title: '네이버 연결 처리 결과 확인', message })
      setUnknown(!(caught instanceof NaverAuthorizationError) || caught.outcomeUnknown)
      if (caught instanceof ApiError && caught.status === 401) { setAuthRequired(true); forbidden.current = true }
      // Mutating requests are never repeated. A fresh status read is the only
      // automatic recovery after an uncertain result or changed review revision.
      if (!(caught instanceof ApiError) || caught.status !== 401) {
        mutation.current = false
        void refresh(true)
      }
    } finally {
      mutation.current = false
      if (active.current) setBusy(false)
    }
  }
  const confirmingCancel = useRef(false)
  async function cancel() {
    const target = current.current
    if (!target || confirmingCancel.current || mutation.current || unknown) return
    confirmingCancel.current = true
    try {
      const accepted = await modal.confirm({ title: '네이버 연결 요청 취소', message: '진행 중인 네이버 연결 요청을 취소하시겠어요?', confirmLabel: '요청 취소', cancelLabel: '계속 연결' })
      if (!accepted || !active.current || current.current?.status !== target.status || current.current.reviewRevision !== target.reviewRevision) return
      await mutate('cancel')
    } finally { confirmingCancel.current = false }
  }
  async function reload() { setLoading(true); await refresh() }
  return { state, loading, error, authRequired, busy, unknown, paused, popupClosed, reload,
    complete: () => mutate('complete'), cancel, reopen: () => mutate('reopen') }
}

function completionKey(attemptId: string, revision: number): string {
  const storageKey = `naver-authorization-confirm:${attemptId}:${revision}`
  try {
    const existing = sessionStorage.getItem(storageKey)
    if (existing && /^[A-Za-z0-9-]{16,128}$/.test(existing)) return existing
    const value = crypto.randomUUID()
    // Only a random idempotency key is retained; no token or seller proof.
    sessionStorage.setItem(storageKey, value)
    return value
  } catch { return crypto.randomUUID() }
}
