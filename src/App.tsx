import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/signup/SignupPage";
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
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}
