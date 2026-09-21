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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
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
              <Route path="invite" element={<AcceptInvitePage />} />
            </Route>
            <Route path="workspaces/:workspaceId" element={<WorkspaceAppLayout />}>
              <Route index element={<Navigate to="connections/meta" replace />} />
              <Route path="members" element={<InviteWorkspacePage />} />
              <Route path="invite" element={<InviteWorkspacePage />} />
              <Route path="connections" element={<Navigate to="meta" replace />} />
              <Route path="connections/meta" element={<WorkspaceConnectionsPage />} />
              <Route path="connections/naver" element={<PlatformComingSoonPage platform="naver" />} />
              <Route path="connections/threads" element={<PlatformComingSoonPage platform="threads" />} />
              <Route path="connections/coupang" element={<PlatformComingSoonPage platform="coupang" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
