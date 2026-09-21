import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../auth/AuthProvider'

export default function Header() {
  const { isLoggedIn, clearSession } = useAuth()

  return (
    <Container>
      <Inner>
        <Brand to="/" aria-label="United Ad 홈">
          United Ad<span aria-hidden="true">.</span>
        </Brand>
        <Navigation aria-label="주 메뉴">
          <NavigationLink href="/#hero">서비스 소개</NavigationLink>
          <NavigationLink href="/#features">기능 소개</NavigationLink>
          <NavigationLink href="/#reviews">리뷰</NavigationLink>
        </Navigation>
        <Actions>
          {isLoggedIn ? (
            <LoginButton type="button" onClick={clearSession}>
              로그아웃
            </LoginButton>
          ) : (
            <LoginLink to="/login">로그인</LoginLink>
          )}
          <StartLink to="/signup">
            시작하기 <span aria-hidden="true">→</span>
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
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const Inner = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  min-width: 0;
  max-width: 1200px;
  min-height: 80px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block: ${({ theme }) => theme.spacing.md};

  @media (max-width: 800px) {
    grid-template-columns: auto 1fr;
    gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    padding-block: ${({ theme }) => theme.spacing.sm};
  }
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-width: 44px;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
  white-space: nowrap;

  span {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 800px) {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: center;
    border-top: 1px solid ${({ theme }) => theme.colors.surfaceMuted};
    padding-top: ${({ theme }) => theme.spacing.sm};
  }
`

const NavigationLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing.sm} 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  @media (max-width: 800px) {
    padding-inline: ${({ theme }) => theme.spacing.sm};
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-self: end;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 800px) {
    grid-column: 2;
    grid-row: 1;
  }
`

const LoginButton = styled.button`
  padding-inline: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;

  @media (max-width: 480px) {
    padding-inline: ${({ theme }) => theme.spacing.sm};
  }

  &:hover:not(:disabled),
  &:active:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const LoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding-inline: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  @media (max-width: 480px) {
    padding-inline: ${({ theme }) => theme.spacing.sm};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const StartLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  @media (max-width: 480px) {
    padding-inline: ${({ theme }) => theme.spacing.sm};
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.onPrimary};
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.primaryActive};
  }
`
