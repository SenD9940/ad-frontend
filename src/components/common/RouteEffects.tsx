import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const title = pathname === '/' ? '팀과 광고를 연결하는 공간' : pathname === '/login' ? '로그인' : pathname === '/signup' ? '회원가입' : pathname === '/workspaces' ? '워크스페이스' : pathname.endsWith('/new') ? '워크스페이스 만들기' : /\/(members|invite)$/.test(pathname) ? '멤버 초대' : pathname.includes('/connections/') || pathname.includes('/callback') ? '플랫폼 연결' : '페이지 안내'
    document.title = `${title} · United Ad`
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash])
  return null
}
