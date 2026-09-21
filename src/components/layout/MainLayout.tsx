import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import Footer from '../common/Footer'
import Header from '../common/Header'

export default function MainLayout() {
  return (
    <Layout>
      <SkipLink href="#main-content">본문으로 바로가기</SkipLink>
      <Header />
      <Main id="main-content">
        <Outlet />
      </Main>
      <Footer />
    </Layout>
  )
}

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: ${({ theme }) => theme.colors.background};
`

const Main = styled.main`
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 1248px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block: clamp(1.5rem, 4vw, 3rem);
  scroll-margin-top: 6rem;
`

const SkipLink = styled.a`
  position: fixed;
  top: ${({ theme }) => theme.spacing.sm};
  left: ${({ theme }) => theme.spacing.md};
  z-index: 200;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-weight: 600;
  transform: translateY(-200%);

  &:focus {
    transform: translateY(0);
  }
`
