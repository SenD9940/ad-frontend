import { Outlet } from 'react-router-dom'
import AppShell from './AppShell'

export default function WorkspaceHomeLayout() {
  return <AppShell><Outlet /></AppShell>
}
