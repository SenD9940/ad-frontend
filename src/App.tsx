import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./components/auth/RequireAuth";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/signup/SignupPage";
import CreateWorkspacePage from "./pages/workspace/CreateWorkspacePage";
import InviteWorkspacePage from "./pages/workspace/InviteWorkspacePage";
import WorkspaceListPage from "./pages/workspace/WorkspaceListPage";
import AcceptInvitePage from "./pages/workspace/AcceptInvitePage";
import { ThemeProvider } from "styled-components";
import theme from "./styles/theme";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route element={<RequireAuth />}>
                  <Route path="workspaces" element={<WorkspaceListPage />} />
                  <Route path="workspaces/new" element={<CreateWorkspacePage />} />
                  <Route
                    path="workspaces/:workspaceId/invite"
                    element={<InviteWorkspacePage />}
                  />
                  <Route path="invite" element={<AcceptInvitePage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}
