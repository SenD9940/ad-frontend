import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../auth/AuthContext'

export default function Header() {
  const { isLoggedIn, clearSession } = useAuth()

  return (
    <Container>
      <Inner>
        <Brand to="/" aria-label="United Ad 홈">
          <BrandMark aria-hidden="true"><i /><i /><i /><i /></BrandMark>
          united ad<span>.</span>
        </Brand>
        <Navigation aria-label="주 메뉴">
          <NavigationLink href="/#features">주요 기능</NavigationLink>
          <NavigationLink href="/#workflow">이용 방법</NavigationLink>
          <NavigationLink href="/#integrations">플랫폼 연동</NavigationLink>
        </Navigation>
        <Actions>
          {isLoggedIn ? (
            <LoginButton type="button" onClick={clearSession}>로그아웃</LoginButton>
          ) : (
            <LoginLink to="/login">로그인</LoginLink>
          )}
          <StartLink to={isLoggedIn ? '/workspaces' : '/signup'}>
            {isLoggedIn ? '워크스페이스' : '시작하기'} <span aria-hidden="true">↗</span>
          </StartLink>
        </Actions>
      </Inner>
    </Container>
  )
}

const Container = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(16px);
`

const Inner = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1248px;
  min-height: 78px;
  margin-inline: auto;
  padding: 12px 32px;

  @media (max-width: 760px) {
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    min-height: 68px;
    padding: 10px 20px 0;
  }
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 9px;
  min-height: 44px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -1.15px;
  text-decoration: none;
  white-space: nowrap;

  > span { margin-left: -8px; color: ${({ theme }) => theme.colors.primary}; }
  &:hover { color: ${({ theme }) => theme.colors.text}; }

  @media (max-width: 440px) {
    font-size: 20px;
    gap: 7px;
  }
`

const BrandMark = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 7px);
  gap: 3px;
  place-content: center;
  width: 31px;
  height: 31px;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.primary};
  transform: rotate(-3deg);

  i { width: 7px; height: 7px; border-radius: 2px; background: white; }
  i:nth-child(2) { opacity: .55; }
  i:nth-child(3) { opacity: .75; }
`

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 760px) {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: center;
    gap: 28px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin-top: 5px;
  }
`

const NavigationLink = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 550;
  text-decoration: none;
  white-space: nowrap;

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 12px;

  @media (max-width: 760px) { grid-column: 2; grid-row: 1; }
  @media (max-width: 440px) { gap: 4px; }
`

const LoginButton = styled.button`
  min-height: 40px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  white-space: nowrap;

  &&:hover:not(:disabled), &&:active:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`

const LoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 550;
  text-decoration: none;
  white-space: nowrap;
`

const StartLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  min-height: 40px;
  padding: 10px 17px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 2px 3px rgb(99 91 255 / 12%);

  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; color: white; }
  @media (max-width: 440px) { gap: 7px; padding-inline: 11px; }
`
