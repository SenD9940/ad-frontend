import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../auth/AuthContext'

export default function NotFoundPage() {
  const { isLoggedIn } = useAuth()
  return <State><span>404</span><h1>페이지를 찾을 수 없어요</h1><p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p><Link to={isLoggedIn ? '/workspaces' : '/'}>{isLoggedIn ? '워크스페이스로 이동' : '홈으로 돌아가기'} →</Link></State>
}
const State = styled.section`display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 80px 20px; text-align: center; > span { color: ${({ theme }) => theme.colors.primary}; font-size: 70px; font-weight: 750; letter-spacing: -5px; } h1 { font-size: 28px; } p { color: ${({ theme }) => theme.colors.textSecondary}; } a { display: inline-flex; align-items: center; min-height: 44px; padding: 10px 20px; border-radius: 8px; color: white; background: ${({ theme }) => theme.colors.primary}; text-decoration: none; font-size: 14px; }`
