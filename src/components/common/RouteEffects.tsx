import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const title = pathname.endsWith('/imweb/products/new') ? '아임웹 상품 등록' : pathname.endsWith('/imweb/performance') ? '아임웹 상품 및 판매 성과' : pathname.endsWith('/connections/imweb/assets') ? '아임웹 자산 편집' : pathname.endsWith('/integrations/imweb/callback') ? '아임웹 연결 확인' : pathname.endsWith('/integrations/imweb/connect') ? '아임웹 연결' : pathname.startsWith('/admin') ? '운영 콘솔' : pathname.endsWith('/support') ? '기술 지원' : pathname === '/' ? '팀과 광고를 연결하는 공간' : pathname === '/login' ? '로그인' : pathname === '/signup' ? '회원가입' : pathname === '/workspaces' ? '워크스페이스' : pathname.endsWith('/naver/orders') ? '스마트스토어 주문·배송·환불' : pathname.endsWith('/naver/products/new') ? '스마트스토어 상품 등록' : pathname.endsWith('/meta/ads/new') ? 'Meta 광고 등록' : pathname.endsWith('/meta/ads/edit') ? 'Meta 광고 수정' : pathname.endsWith('/new') ? '워크스페이스 만들기' : pathname.endsWith('/meta/performance') ? 'Meta 광고 성과' : pathname.endsWith('/connections/meta/assets') ? 'Meta 자산 편집' : pathname.endsWith('/naver/performance') ? '상품 및 판매 성과' : pathname.endsWith('/connections/naver/assets') ? '네이버 자산 편집' : /\/(members|invite)$/.test(pathname) ? '멤버 초대' : pathname.endsWith('/integrations/naver/callback') ? '네이버 연결 확인' : pathname.includes('/connections/') || pathname.includes('/callback') ? '플랫폼 연결' : '페이지 안내'
    document.title = `${title} · United Ad`
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash])
  return null
}
