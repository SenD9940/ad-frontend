import SupportGate from '../../support/SupportGate'
import { readSupportSession } from '../../support/session'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function RequireAuth() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (readSupportSession()) return <SupportGate><Outlet /></SupportGate>

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
