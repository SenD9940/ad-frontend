import { Fragment, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { adminGet, adminWrite } from './api'
import { ADMIN_SESSION_EVENT, clearAdminSession, readAdminSession, saveAdminSession, type AdminSession } from './session'
import OverviewPage from './OverviewPage'
import { AuditPage, ConnectionsPage, UsersPage, WorkspacesPage } from './DataPages'
import { ConnectionDetailPage, UserDetailPage, WorkspaceDetailPage } from './DetailPages'
import { SupportDetailPage, SupportListPage } from './SupportPages'
import SupportCreatePage from './SupportCreatePage'
import { StudioTemplateEditPage, StudioTemplatesPage } from './StudioPages'
import StudioCategoriesPage from './StudioCategoriesPage'
import { Loading, Notice } from './ui'
import type { AdminUser } from './types'
import './admin.css'

const navigation = [['/admin', '◫', '운영 대시보드'], ['/admin/users', '♙', '회원 관리'], ['/admin/workspaces', '▦', '워크스페이스'], ['/admin/connections', '⇄', '플랫폼 연동'], ['/admin/support', '♡', '기술 지원'], ['/admin/studio', '✧', 'AI 스튜디오'], ['/admin/audit', '≡', '운영 이력']]
export default function AdminApp() {
  const [session, setSession] = useState(readAdminSession)
  const [verified, setVerified] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const location = useLocation()
  useEffect(() => {
    const update = () => setSession(readAdminSession())
    window.addEventListener(ADMIN_SESSION_EVENT, update)
    const timer = window.setInterval(update, 15000)
    return () => { window.removeEventListener(ADMIN_SESSION_EVENT, update); window.clearInterval(timer) }
  }, [])
  useEffect(() => {
    if (!session) return
    const controller = new AbortController()
    adminGet<AdminUser>('/auth/me', controller.signal).then(user => {
      if (controller.signal.aborted) return
      if (user.role !== 'ADMIN' || user.status !== 'REGISTERED') { clearAdminSession(); return }
      setError(''); setVerified(session.accessToken)
    }).catch((caught: unknown) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : '운영자 인증에 실패했습니다.') })
    return () => controller.abort()
  }, [session?.accessToken, attempt]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!session) return location.pathname === '/admin/login' ? <Login /> : <Navigate to="/admin/login" replace />
  if (verified !== session.accessToken) return <div className="oa-login-form" style={{ minHeight: '100dvh' }}>{error ? <Notice error>{error}<button className="oa-button" onClick={() => { setError(''); setAttempt(v => v + 1) }}>다시 확인</button><button className="oa-button oa-secondary" onClick={clearAdminSession}>로그인으로</button></Notice> : <Loading />}</div>
  if (location.pathname === '/admin/login') return <Navigate to="/admin" replace />
  return <div className="oa-shell"><aside className="oa-sidebar"><Link to="/admin" className="oa-brand"><span className="oa-logo">u.</span>united ad.</Link><p className="oa-product-tag">OPERATIONS CONSOLE</p><nav aria-label="운영 관리 메뉴">{navigation.map(([path, icon, label]) => <Fragment key={path}><NavLink end={path === '/admin'} className="oa-nav" to={path}><span aria-hidden="true">{icon}</span>{label}</NavLink>{path === '/admin/studio' && location.pathname.startsWith('/admin/studio') && <div className="studio-sidebar-subnav"><NavLink end to="/admin/studio">샘플 관리</NavLink><NavLink to="/admin/studio/categories">카테고리 관리</NavLink></div>}</Fragment>)}</nav><div className="oa-sidebar-foot">고객의 연결을 더 편리하게.<br />서비스 운영과 기술 지원을 한곳에서.</div></aside><div className="oa-stage"><header className="oa-topbar"><span>United Ad <strong> / 운영 관리</strong></span><div className="oa-account"><span className="oa-avatar">{session.user.name?.slice(0, 1) || 'A'}</span><strong>{session.user.email}</strong><button className="oa-button oa-secondary" disabled={pending} onClick={async () => { setPending(true); setError(''); try { await adminWrite('/auth/logout'); clearAdminSession() } catch (caught) { setError(caught instanceof Error ? caught.message : '로그아웃하지 못했습니다.') } finally { setPending(false) } }}>로그아웃</button></div></header><main className="oa-main">{error && <Notice error>{error}</Notice>}<Routes><Route index element={<OverviewPage />} /><Route path="users" element={<UsersPage />} /><Route path="users/:id" element={<UserDetailPage />} /><Route path="workspaces" element={<WorkspacesPage />} /><Route path="workspaces/:id" element={<WorkspaceDetailPage />} /><Route path="connections" element={<ConnectionsPage />} /><Route path="connections/:id" element={<ConnectionDetailPage />} /><Route path="support" element={<SupportListPage />} /><Route path="support/new" element={<SupportCreatePage />} /><Route path="support/:id" element={<SupportDetailPage />} /><Route path="studio" element={<StudioTemplatesPage />} /><Route path="studio/categories" element={<StudioCategoriesPage />} /><Route path="studio/new" element={<StudioTemplateEditPage />} /><Route path="studio/:id" element={<StudioTemplateEditPage />} /><Route path="audit" element={<AuditPage />} /><Route path="*" element={<Notice>페이지를 찾을 수 없습니다. <Link to="/admin">대시보드로</Link></Notice>} /></Routes></main></div></div>
}
function Login() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  return <div className="oa-login"><aside className="oa-login-aside"><span>UNITED AD / OPERATIONS</span><h1>서비스의 모든 연결,<br />운영의 한 화면에서.</h1><p>회원과 워크스페이스를 관리하고,<br />고객에게 필요한 기술 지원을 제공하세요.</p></aside><section className="oa-login-form"><form onSubmit={async event => { event.preventDefault(); const values = new FormData(event.currentTarget); setPending(true); setError(''); try { const result = await adminWrite<AdminSession>('/auth/login', { email: String(values.get('email')).trim(), password: values.get('password') }); saveAdminSession(result) } catch (caught) { setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.') } finally { setPending(false) } }}><p className="oa-eyebrow">OPERATIONS CONSOLE</p><h2>운영자 로그인</h2><p className="oa-muted">관리자 권한이 있는 계정으로 로그인해 주세요.</p><label className="oa-field"><span>이메일</span><input name="email" type="email" autoComplete="username" required maxLength={254} placeholder="admin@company.com" /></label><label className="oa-field"><span>비밀번호</span><input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>{error && <Notice error>{error}</Notice>}<button className="oa-button" disabled={pending}>{pending ? '확인 중…' : '운영 콘솔 로그인'}</button><p className="oa-muted" style={{ marginTop: 24 }}><Link to="/login">서비스 회원 로그인으로</Link></p></form></section></div>
}
