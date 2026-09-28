import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './components/auth/RequireAuth'
import RouteEffects from './components/common/RouteEffects'
import MainLayout from './components/layout/MainLayout'
import WorkspaceAppLayout from './components/layout/WorkspaceAppLayout'
import WorkspaceHomeLayout from './components/layout/WorkspaceHomeLayout'
import NotFoundPage from './pages/NotFoundPage'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/login/LoginPage'
import SignupPage from './pages/signup/SignupPage'
import AcceptInvitePage from './pages/workspace/AcceptInvitePage'
import CreateWorkspacePage from './pages/workspace/CreateWorkspacePage'
import InviteWorkspacePage from './pages/workspace/InviteWorkspacePage'
import MetaOAuthCallbackPage from './pages/workspace/MetaOAuthCallbackPage'
import PlatformComingSoonPage from './pages/workspace/PlatformComingSoonPage'
import WorkspaceConnectionsPage from './pages/workspace/WorkspaceConnectionsPage'
import WorkspaceListPage from './pages/workspace/WorkspaceListPage'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const CustomerSupportPage = lazy(() => import('./support/CustomerSupportPage'))
const SupportPaymentResultPage = lazy(() => import('./support/SupportPaymentResultPage'))

const NaverOAuthCallbackPage = lazy(() => import('./pages/workspace/NaverOAuthCallbackPage'))
const NaverConnectionsPage = lazy(() => import('./pages/workspace/NaverConnectionsPage'))
const NaverHomePage = lazy(() => import('./pages/workspace/NaverHomePage'))
const NaverPerformancePage = lazy(() => import('./pages/workspace/NaverPerformancePage'))
const NaverProductCreatePage = lazy(() => import('./pages/workspace/NaverProductCreatePage'))
const MetaPerformancePage = lazy(() => import('./pages/workspace/MetaPerformancePage'))
const MetaHomePage = lazy(() => import('./pages/workspace/MetaHomePage'))
const MetaAdCreatePage = lazy(() => import('./pages/workspace/MetaAdCreatePage'))
const MetaAdEditPage = lazy(() => import('./pages/workspace/MetaAdEditPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={<p role="status">운영 콘솔을 불러오는 중…</p>}><AdminApp /></Suspense>} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route element={<WorkspaceHomeLayout />}>
              <Route path="workspaces" element={<WorkspaceListPage />} />
              <Route path="workspaces/new" element={<CreateWorkspacePage />} />
              <Route path="settings/integrations/meta/callback" element={<MetaOAuthCallbackPage />} />
              <Route path="settings/integrations/naver/callback" element={
                <Suspense fallback={<p role="status">네이버 연결 상태를 확인하는 중…</p>}>
                  <NaverOAuthCallbackPage />
                </Suspense>
              } />
              <Route path="invite" element={<AcceptInvitePage />} />
            </Route>
            <Route path="workspaces/:workspaceId" element={<WorkspaceAppLayout />}>
              <Route index element={<Navigate to="connections/meta" replace />} />
              <Route path="support" element={<Suspense fallback={<p role="status">기술 지원 요청을 불러오는 중…</p>}><CustomerSupportPage /></Suspense>} />
              <Route path="support/:ticketId/payment/:outcome" element={<Suspense fallback={<p role="status">결제 결과를 확인하는 중…</p>}><SupportPaymentResultPage /></Suspense>} />
              <Route path="members" element={<InviteWorkspacePage />} />
              <Route path="invite" element={<InviteWorkspacePage />} />
              <Route path="connections" element={<Navigate to="meta" replace />} />
              <Route path="connections/meta" element={
                <Suspense fallback={<p role="status">Meta 화면을 불러오는 중…</p>}>
                  <MetaHomePage />
                </Suspense>
              } />
              <Route path="connections/meta/assets" element={<WorkspaceConnectionsPage />} />
              <Route path="meta/performance" element={
                <Suspense fallback={<p role="status">Meta 광고 성과 화면을 불러오는 중…</p>}>
                  <MetaPerformancePage />
                </Suspense>
              } />
              <Route path="meta/ads/new" element={
                <Suspense fallback={<p role="status">광고 등록 화면을 불러오는 중…</p>}>
                  <MetaAdCreatePage />
                </Suspense>
              } />
              <Route path="meta/ads/edit" element={
                <Suspense fallback={<p role="status">광고 수정 화면을 불러오는 중…</p>}>
                  <MetaAdEditPage />
                </Suspense>
              } />
              <Route path="connections/naver" element={
                <Suspense fallback={<p role="status">네이버 화면을 불러오는 중…</p>}>
                  <NaverHomePage />
                </Suspense>
              } />
              <Route path="connections/naver/assets" element={
                <Suspense fallback={<p role="status">네이버 연결 화면을 불러오는 중…</p>}>
                  <NaverConnectionsPage />
                </Suspense>
              } />
              <Route path="naver/performance" element={
                <Suspense fallback={<p role="status">스마트스토어 성과 화면을 불러오는 중…</p>}>
                  <NaverPerformancePage />
                </Suspense>
              } />
              <Route path="naver/products/new" element={
                <Suspense fallback={<p role="status">스마트스토어 상품 등록 화면을 불러오는 중…</p>}>
                  <NaverProductCreatePage />
                </Suspense>
              } />
              <Route path="connections/threads" element={<PlatformComingSoonPage platform="threads" />} />
              <Route path="connections/coupang" element={<PlatformComingSoonPage platform="coupang" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
