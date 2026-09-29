import { useErrorModal } from '../components/common/useErrorModal'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import http, { ApiError } from '../api/http'
import { clearSupportSession, localTime, readSupportSession, supportExpired } from './session'
import type { SupportGrant } from '../admin/types'
import '../admin/admin.css'
import './support.css'

export default function SupportGate({ children }: { children: ReactNode }) {
  const [session] = useState(readSupportSession)
  return session ? <ActiveSupport key={session.sessionId} session={session}>{children}</ActiveSupport> : children
}
function ActiveSupport({ session, children }: { session: SupportGrant; children: ReactNode }) {
  const { pathname } = useLocation()
  const [now, setNow] = useState(Date.now)
  const [verified, setVerified] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [error, setError] = useState('')
  useErrorModal(error, '기술 지원 접속 확인')
  const [pending, setPending] = useState(false)
  useEffect(() => {
    let stopped = false
    const verify = async () => {
      try { const { data } = await http.get<{ body: Omit<SupportGrant, 'accessToken'> }>('/api/support/session'); if (!stopped) { setVerified(data.body.sessionId === session.sessionId && data.body.workspaceId === session.workspaceId); setError('') } }
      catch (caught) { if (!stopped) { setVerified(false); setInvalid(caught instanceof ApiError && (caught.status === 401 || caught.status === 403)); setError(caught instanceof Error ? caught.message : '지원 권한을 확인하지 못했습니다.') } }
    }
    void verify()
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    const check = window.setInterval(() => { if (!supportExpired(session)) void verify() }, 30000)
    return () => { stopped = true; window.clearInterval(timer); window.clearInterval(check) }
  }, [session])
  const remaining = Math.max(0, Math.floor((localTime(session.expiresAt) - now) / 1000))
  const writableRoute = session.accessMode !== 'READ_ONLY' || !/\/(ads\/(new|edit)|products\/new)$/.test(pathname)
  const allowed = writableRoute && new RegExp(`^/workspaces/${session.workspaceId}(?:$|/connections(?:$|/(?:meta|naver)(?:/assets)?$)|/(?:meta/(?:performance|ads/(?:new|edit))|naver/(?:performance|products/new))$)`).test(pathname)
  const end = async () => {
    setPending(true); setError('')
    try {
      if (!invalid && remaining > 0) await http.post('/api/support/session/end')
      clearSupportSession(); window.location.assign(`/admin/support/${session.ticketId}`)
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) { clearSupportSession(); window.location.assign(`/admin/support/${session.ticketId}`); return }
      setError('지원 접속 종료를 확인하지 못했습니다. 다시 시도해 주세요.'); setPending(false)
    }
  }
  return <><div className="support-banner" role="region" aria-label="고객 기술 지원 모드"><div><strong>고객 기술 지원 중 · {session.accessMode === 'OPERATE' ? '조회 및 조작' : '조회 전용'}</strong><span>회원 #{session.customerUserId} · 워크스페이스 #{session.workspaceId} · 요청 #{session.ticketId}</span><small>{session.accessMode === 'OPERATE' ? '변경 사항은 고객 계정에 실제로 반영됩니다. 작업 요청이 기록됩니다.' : '성과와 자산을 조회할 수 있습니다. 등록·수정은 제한됩니다.'}</small></div><div className="support-banner-actions"><span aria-label="지원 접속 남은 시간">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span><button type="button" disabled={pending} onClick={() => void end()}>{pending ? '종료 중…' : '지원 종료 · 어드민으로'}</button></div></div>{error && <div className="support-error" role="alert">{error}</div>}{remaining > 0 && verified && !invalid && allowed ? children : <main className="support-blocked"><h1>{remaining === 0 || invalid ? '지원 접속이 종료되었습니다' : !allowed ? (writableRoute ? '승인된 지원 범위 밖의 화면입니다' : '조회 전용 지원입니다') : '지원 권한을 확인하고 있습니다'}</h1><p>{remaining === 0 || invalid ? '만료되거나 철회된 접속으로는 고객 화면을 사용할 수 없습니다.' : !allowed ? '해당 워크스페이스의 Meta와 네이버 화면에서 작업할 수 있습니다.' : '잠시 후 자동으로 다시 확인합니다.'}</p>{!allowed && remaining > 0 && <a href={`/workspaces/${session.workspaceId}/connections/meta`}>승인된 워크스페이스로</a>}<button className="oa-button" disabled={pending} onClick={() => void end()}>지원 종료 · 어드민으로</button></main>}</>
}
