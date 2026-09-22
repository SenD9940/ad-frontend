import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../auth/AuthContext'
import Icon from '../common/Icon'

const platforms = [
  { key: 'meta', name: 'Meta', mark: '∞', color: '#1877f2', soon: false },
  { key: 'naver', name: '네이버', mark: 'N', color: '#03a95b', soon: false },
  { key: 'threads', name: 'Threads', mark: '@', color: '#202331', soon: true },
  { key: 'coupang', name: '쿠팡', mark: 'C', color: '#ee5b43', soon: true },
]

export default function AppShell({ children, workspaceId, workspaceName }: { children: ReactNode; workspaceId?: string; workspaceName?: string }) {
  const { clearSession } = useAuth()
  const { pathname } = useLocation()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const menuOpen = openPath === pathname
  const activePlatform = platforms.find((p) => pathname.endsWith(`/connections/${p.key}`))
  const pageName = activePlatform ? `${activePlatform.name} 연결` : /\/(members|invite)$/.test(pathname) && workspaceId ? '멤버 관리' : pathname.endsWith('/new') ? '워크스페이스 만들기' : pathname === '/invite' ? '초대 수락' : pathname.includes('/callback') ? '플랫폼 연결' : '워크스페이스'

  return (
    <Shell>
      <Skip href="#workspace-main">본문으로 바로가기</Skip>
      <Sidebar>
        <BrandRow>
          <Brand to="/workspaces" aria-label="United Ad 워크스페이스"><Mark aria-hidden="true"><i /><i /><i /><i /></Mark>united ad<span>.</span></Brand>
          <MenuButton type="button" aria-expanded={menuOpen} aria-controls="app-navigation" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpenPath(menuOpen ? null : pathname)}><Icon name={menuOpen ? 'close' : 'menu'} /></MenuButton>
        </BrandRow>
        <SidebarBody id="app-navigation" $open={menuOpen} onKeyDown={(event) => { if (event.key === 'Escape') setOpenPath(null) }}>
          <WorkspaceSwitcher to="/workspaces"><WorkspaceAvatar>{workspaceName?.slice(0, 1) || 'W'}</WorkspaceAvatar><SwitcherCopy><strong>{workspaceName || '내 워크스페이스'}</strong><small>{workspaceId ? '워크스페이스 전환' : '팀과 광고를 연결하는 공간'}</small></SwitcherCopy><Icon name="chevron" size={14} /></WorkspaceSwitcher>
          <Nav aria-label="워크스페이스 메뉴">
            <NavLabel>WORKSPACE</NavLabel>
            <NavItem to="/workspaces" end><Icon name="grid" size={18} />모든 워크스페이스</NavItem>
            {workspaceId ? <NavItem to={`/workspaces/${workspaceId}/members`} className={pathname.endsWith('/invite') ? 'active' : undefined}><Icon name="users" size={18} />멤버 관리</NavItem> : <NavItem to="/workspaces/new"><Icon name="plus" size={18} />워크스페이스 만들기</NavItem>}
          </Nav>
          {workspaceId ? <Nav aria-label="플랫폼 연결"><NavLabel>PLATFORMS</NavLabel>{platforms.map((p) => <NavItem key={p.key} to={`/workspaces/${workspaceId}/connections/${p.key}`}><PlatformMark $color={p.color}>{p.mark}</PlatformMark>{p.name}{p.soon && <Soon>준비 중</Soon>}</NavItem>)}</Nav> : <Guide><GuideIcon><Icon name="link" /></GuideIcon><strong>연결에서 시작되는 협업</strong><p>워크스페이스에서 광고 플랫폼을 연결하고 팀과 함께 관리하세요.</p><GuideLink to="/workspaces/new">새 공간 만들기 <Icon name="arrow" size={15} /></GuideLink></Guide>}
          <SidebarBottom><HelpLink href="mailto:dnqlsdnqls529@orinan.kr"><Icon name="help" size={18} />도움이 필요하신가요?<Icon name="arrow" size={15} /></HelpLink><Account><AccountAvatar>U</AccountAvatar><div><strong>United Ad 계정</strong><small>팀을 위한 연결된 공간</small></div><Logout type="button" onClick={clearSession} aria-label="로그아웃" title="로그아웃"><Icon name="logout" size={18} /></Logout></Account></SidebarBottom>
        </SidebarBody>
      </Sidebar>
      <Stage>
        <TopBar><Breadcrumb aria-label="현재 위치"><Icon name="grid" size={16} /><span>{workspaceName || '내 공간'}</span><Icon name="chevron" size={12} /><strong>{pageName}</strong></Breadcrumb><TopBrand>United Ad <span>Workspace</span></TopBrand></TopBar>
        <Main id="workspace-main" tabIndex={-1}>{children}</Main>
        <AppFooter><span>© {new Date().getFullYear()} United Ad</span><span>팀과 광고를 연결하는 하나의 공간.</span></AppFooter>
      </Stage>
    </Shell>
  )
}

const Shell = styled.div`display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100dvh; background: ${({ theme }) => theme.colors.background}; @media(max-width: 800px) { grid-template-columns: minmax(0, 1fr); }`
const Skip = styled.a`position: fixed; top: 8px; left: 12px; z-index: 200; padding: 12px 18px; border-radius: 8px; background: white; box-shadow: ${({ theme }) => theme.shadows.md}; transform: translateY(-200%); &:focus { transform: translateY(0); }`
const Sidebar = styled.aside`position: sticky; top: 0; display: flex; flex-direction: column; height: 100dvh; border-right: 1px solid ${({ theme }) => theme.colors.border}; background: white; @media(max-width: 800px) { position: relative; height: auto; border-right: 0; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; }`
const BrandRow = styled.div`display: flex; align-items: center; justify-content: space-between; min-height: 76px; padding: 12px 25px; @media(max-width: 800px) { min-height: 65px; padding: 10px 20px; }`
const Brand = styled(Link)`display: inline-flex; align-items: center; gap: 9px; color: ${({ theme }) => theme.colors.text}; font-size: 23px; font-weight: 800; letter-spacing: -1px; text-decoration: none; > span { color: ${({ theme }) => theme.colors.primary}; margin-left: -8px; } &:hover { color: ${({ theme }) => theme.colors.text}; }`
const Mark = styled.span`display: grid; grid-template-columns: repeat(2, 6px); gap: 3px; place-content: center; width: 29px; height: 29px; border-radius: 8px; background: ${({ theme }) => theme.colors.primary}; i { width: 6px; height: 6px; border-radius: 1.5px; background: white; } i:nth-child(2) { opacity: .5; } i:nth-child(3) { opacity: .7; }`
const MenuButton = styled.button`display: none; width: 40px; min-height: 40px; padding: 8px; color: ${({ theme }) => theme.colors.text}; background: ${({ theme }) => theme.colors.surfaceMuted}; &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryLight}; } @media(max-width: 800px) { display: inline-flex; }`
const SidebarBody = styled.div<{ $open: boolean }>`display: flex; flex: 1; flex-direction: column; gap: 26px; min-height: 0; overflow-y: auto; padding: 14px 16px 0; @media(max-width: 800px) { display: ${({ $open }) => $open ? 'flex' : 'none'}; padding: 6px 20px 0; gap: 18px; }`
const WorkspaceSwitcher = styled(Link)`display: flex; align-items: center; gap: 10px; padding: 11px 10px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 9px; color: ${({ theme }) => theme.colors.text}; text-decoration: none; &:hover { border-color: ${({ theme }) => theme.colors.borderHover}; color: ${({ theme }) => theme.colors.text}; }`
const WorkspaceAvatar = styled.span`display: grid; place-items: center; width: 33px; height: 33px; flex-shrink: 0; border-radius: 8px; background: #eeecff; color: #635bff; font-size: 14px; font-weight: 700;`
const SwitcherCopy = styled.span`display: flex; flex: 1; flex-direction: column; min-width: 0; gap: 2px; strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 650; } small { color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; }`
const Nav = styled.nav`display: flex; flex-direction: column; gap: 5px;`
const NavLabel = styled.p`padding: 0 12px 6px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 650; letter-spacing: 1.3px;`
const NavItem = styled(NavLink)`display: flex; align-items: center; gap: 11px; min-height: 43px; padding: 10px 12px; border-radius: 7px; color: ${({ theme }) => theme.colors.textSecondary}; text-decoration: none; font-size: 13px; font-weight: 550; &:hover { color: ${({ theme }) => theme.colors.text}; background: ${({ theme }) => theme.colors.surfaceMuted}; } &.active { color: ${({ theme }) => theme.colors.primary}; background: ${({ theme }) => theme.colors.primaryLight}; font-weight: 650; }`
const PlatformMark = styled.span<{ $color: string }>`display: grid; place-items: center; width: 18px; color: ${({ $color }) => $color}; font-size: 19px; font-weight: 850; line-height: 1;`
const Soon = styled.span`margin-left: auto; padding: 2px 5px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 4px; color: ${({ theme }) => theme.colors.textMuted}; background: white; font-size: 9px; font-weight: 500;`
const Guide = styled.div`padding: 17px 14px; border: 1px solid #ebe8ff; border-radius: 10px; background: #faf9ff; strong { display: block; margin: 12px 0 7px; font-size: 12px; } p { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; line-height: 1.8; word-break: keep-all; }`
const GuideIcon = styled.span`display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: #eeecff; color: #635bff;`
const GuideLink = styled(Link)`display: inline-flex; align-items: center; gap: 10px; min-height: 36px; margin-top: 8px; font-size: 11px; font-weight: 650; text-decoration: none;`
const SidebarBottom = styled.div`margin-top: auto;`
const HelpLink = styled.a`display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; text-decoration: none; svg:last-child { margin-left: auto; }`
const Account = styled.div`display: flex; align-items: center; gap: 9px; padding: 18px 0; border-top: 1px solid ${({ theme }) => theme.colors.border}; > div { flex: 1; } strong, small { display: block; } strong { font-size: 11px; font-weight: 600; } small { margin-top: 2px; font-size: 9px; color: ${({ theme }) => theme.colors.textMuted}; }`
const AccountAvatar = styled.span`display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #f1efe9; color: #7a6f57; font-size: 12px; font-weight: 600;`
const Logout = styled.button`min-height: 38px; width: 38px; padding: 8px; color: ${({ theme }) => theme.colors.textMuted}; background: transparent; &:hover:not(:disabled) { color: ${({ theme }) => theme.colors.text}; background: ${({ theme }) => theme.colors.surfaceMuted}; }`
const Stage = styled.div`display: flex; flex-direction: column; min-width: 0;`
const TopBar = styled.header`display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 76px; padding: 16px 36px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; background: white; @media(max-width: 800px) { min-height: 52px; padding: 12px 20px; }`
const Breadcrumb = styled.nav`display: flex; align-items: center; gap: 12px; min-width: 0; font-size: 12px; color: ${({ theme }) => theme.colors.textMuted}; span { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } strong { color: ${({ theme }) => theme.colors.text}; font-weight: 550; white-space: nowrap; } @media(max-width: 450px) { gap: 8px; span { max-width: 105px; } }`
const TopBrand = styled.p`font-size: 11px; font-weight: 650; color: ${({ theme }) => theme.colors.textSecondary}; white-space: nowrap; span { margin-left: 5px; font-weight: 400; color: ${({ theme }) => theme.colors.textMuted}; } @media(max-width: 600px) { display: none; }`
const Main = styled.main`width: 100%; max-width: 1400px; flex: 1; margin-inline: auto; padding: 38px 36px; min-width: 0; &:focus { outline: none; } @media(max-width: 1000px) { padding: 28px 24px; } @media(max-width: 600px) { padding: 26px 18px; }`
const AppFooter = styled.footer`display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 18px 36px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; @media(max-width: 600px) { padding: 18px; }`
